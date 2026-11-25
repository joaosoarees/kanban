import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import * as z from "zod";
import { COLUMN_ORDER } from "@/features/boards/server/access";
import { db } from "@/server/db";

type CardRow = {
  id: string;
  columnId: string;
  title: string;
  hasDescription: boolean;
  assigneeId: string | null;
  labelIds: string[];
};

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
        labels: { select: { id: true, name: true, color: true } },
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
        card.description IS NOT NULL AS "hasDescription",
        card."assigneeId",
        ARRAY(
          SELECT applied."labelId"::text
          FROM card_labels applied
          WHERE applied."cardId" = card.id
        ) AS "labelIds"
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
      labels: board.labels.toSorted(
        (a, b) =>
          a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }) ||
          a.id.localeCompare(b.id),
      ),
      columns: board.columns.map((column) => ({
        id: column.id,
        name: column.name,
        position: column.position,
        cards: cardsByColumn.get(column.id) ?? [],
      })),
    };
  },
);

export async function getCardDescription(
  workspaceId: string,
  boardId: string,
  cardId: string,
) {
  const ref = z
    .object({ boardId: z.uuid(), cardId: z.uuid() })
    .safeParse({ boardId, cardId });
  if (!ref.success) {
    return null;
  }

  return db.card.findFirst({
    where: {
      id: ref.data.cardId,
      column: { boardId: ref.data.boardId, board: { workspaceId } },
    },
    select: { description: true },
  });
}
