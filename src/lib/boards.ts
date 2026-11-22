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

export const COLUMN_ORDER = [{ position: "asc" }, { id: "asc" }] as const;

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

    return board;
  },
);
