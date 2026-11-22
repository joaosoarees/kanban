import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import * as z from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { ActionError } from "@/lib/action-result";
import { db } from "@/lib/db";

export const BOARD_GONE: ActionError = {
  status: "error",
  message: "Esse quadro não existe mais.",
  gone: true,
};

export const COLUMN_GONE: ActionError = {
  status: "error",
  message: "Essa coluna não existe mais. O quadro foi atualizado.",
  gone: true,
};

export const CARD_GONE: ActionError = {
  status: "error",
  message: "Esse card não existe mais. O quadro foi atualizado.",
  gone: true,
};

export const COLUMN_ORDER = [{ position: "asc" }, { id: "asc" }] as const;

type CardRow = {
  id: string;
  columnId: string;
  title: string;
  hasDescription: boolean;
};

export async function lockBoard(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  boardId: unknown,
) {
  const id = z.uuid().safeParse(boardId);
  if (!id.success) {
    return null;
  }

  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM boards
    WHERE id = ${id.data}::uuid AND "workspaceId" = ${workspaceId}::uuid
    FOR UPDATE
  `;
  return locked.length === 0 ? null : id.data;
}

export async function getBoards(workspaceId: string) {
  return db.board.findMany({
    where: { workspaceId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, name: true, createdAt: true },
  });
}

export const requireBoard = cache(
  async (workspaceId: string, boardId: string) => {
    const id = z.uuid().safeParse(boardId);
    if (!id.success) {
      notFound();
    }

    const board = await db.board.findFirst({
      where: { id: id.data, workspaceId },
      select: {
        id: true,
        name: true,
        columns: {
          orderBy: [...COLUMN_ORDER],
          select: { id: true, name: true, position: true },
        },
      },
    });
    if (!board) {
      notFound();
    }

    const cards = await db.$queryRaw<CardRow[]>`
      SELECT
        card.id,
        card."columnId",
        card.title,
        card.description IS NOT NULL AS "hasDescription"
      FROM cards card
      JOIN columns board_column ON board_column.id = card."columnId"
      WHERE board_column."boardId" = ${board.id}::uuid
      ORDER BY card.position, card.id
    `;

    const cardsByColumn = new Map<string, Omit<CardRow, "columnId">[]>();
    for (const { columnId, ...card } of cards) {
      const columnCards = cardsByColumn.get(columnId) ?? [];
      columnCards.push(card);
      cardsByColumn.set(columnId, columnCards);
    }

    return {
      id: board.id,
      name: board.name,
      columns: board.columns.map((column) => ({
        id: column.id,
        name: column.name,
        position: column.position,
        cards: cardsByColumn.get(column.id) ?? [],
      })),
    };
  },
);
