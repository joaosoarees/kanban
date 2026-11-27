import "server-only";
import * as z from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { ActionError } from "@/lib/action-result";

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

export const COMMENT_GONE: ActionError = {
  status: "error",
  message: "Este comentário foi excluído.",
  gone: true,
};

export const CHECKLIST_ITEM_GONE: ActionError = {
  status: "error",
  message: "Esse item não existe mais. O card foi atualizado.",
  gone: true,
};

export function parseCardRef(boardId: unknown, cardId: unknown) {
  const board = z.uuid().safeParse(boardId);
  const card = z.uuid().safeParse(cardId);
  if (!board.success || !card.success) {
    return null;
  }
  return { boardId: board.data, cardId: card.data };
}

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

export async function lockCard(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  ref: { boardId: string; cardId: string },
) {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT card.id FROM cards card
    JOIN columns board_column ON board_column.id = card."columnId"
    JOIN boards board ON board.id = board_column."boardId"
    WHERE card.id = ${ref.cardId}::uuid
      AND board_column."boardId" = ${ref.boardId}::uuid
      AND board."workspaceId" = ${workspaceId}::uuid
    FOR NO KEY UPDATE OF card
  `;
  return locked.length > 0;
}
