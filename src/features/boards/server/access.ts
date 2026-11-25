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
