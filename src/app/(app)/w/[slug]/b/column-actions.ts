"use server";

import * as z from "zod";
import type { Prisma } from "@/generated/prisma/client";
import {
  FORBIDDEN,
  INVALID,
  invalidFields,
  type ActionResult,
} from "@/lib/action-result";
import { columnNameSchema, moveColumnSchema } from "@/lib/board-schemas";
import { BOARD_GONE, COLUMN_GONE, COLUMN_ORDER, lockBoard } from "@/lib/boards";
import { planMove, positionAtEnd } from "@/lib/position";
import { loadActorAllowedTo, revalidateWorkspace } from "@/lib/workspaces";
import { db } from "@/server/db";

async function lockBoardColumns(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  boardId: unknown,
) {
  const id = await lockBoard(tx, workspaceId, boardId);
  if (id === null) {
    return null;
  }

  const columns = await tx.column.findMany({
    where: { boardId: id },
    orderBy: [...COLUMN_ORDER],
    select: { id: true, position: true },
  });
  return { id, columns };
}

function parseColumnRef(boardId: unknown, columnId: unknown) {
  const board = z.uuid().safeParse(boardId);
  const column = z.uuid().safeParse(columnId);
  if (!board.success || !column.success) {
    return null;
  }
  return { boardId: board.data, columnId: column.data };
}

export async function createColumnAction(
  workspaceId: unknown,
  boardId: unknown,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const actor = await loadActorAllowedTo(workspaceId, "manageColumns");
  if (!actor) {
    return FORBIDDEN;
  }

  const parsed = columnNameSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const column = await db.$transaction(async (tx) => {
    const board = await lockBoardColumns(tx, actor.workspaceId, boardId);
    if (!board) {
      return null;
    }
    return tx.column.create({
      data: {
        boardId: board.id,
        name: parsed.data.name,
        position: positionAtEnd(board.columns),
      },
      select: { id: true },
    });
  });

  revalidateWorkspace(actor.slug);
  return column ? { status: "success", data: column } : BOARD_GONE;
}

export async function renameColumnAction(
  workspaceId: unknown,
  boardId: unknown,
  columnId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageColumns");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseColumnRef(boardId, columnId);
  if (!ref) {
    return COLUMN_GONE;
  }

  const parsed = columnNameSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const { count } = await db.column.updateMany({
    where: {
      id: ref.columnId,
      boardId: ref.boardId,
      board: { workspaceId: actor.workspaceId },
    },
    data: { name: parsed.data.name },
  });

  revalidateWorkspace(actor.slug);
  return count === 0 ? COLUMN_GONE : { status: "success", data: undefined };
}

export async function deleteColumnAction(
  workspaceId: unknown,
  boardId: unknown,
  columnId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageColumns");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseColumnRef(boardId, columnId);
  if (!ref) {
    return COLUMN_GONE;
  }

  await db.$transaction(async (tx) => {
    const board = await lockBoardColumns(tx, actor.workspaceId, ref.boardId);
    if (board) {
      await tx.column.deleteMany({
        where: { id: ref.columnId, boardId: board.id },
      });
    }
  });

  revalidateWorkspace(actor.slug);
  return { status: "success", data: undefined };
}

export async function moveColumnAction(
  workspaceId: unknown,
  boardId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageColumns");
  if (!actor) {
    return FORBIDDEN;
  }

  const parsed = moveColumnSchema.safeParse(input);
  if (!parsed.success) {
    return INVALID;
  }

  const failure = await db.$transaction(async (tx) => {
    const board = await lockBoardColumns(tx, actor.workspaceId, boardId);
    if (!board) {
      return BOARD_GONE;
    }

    const updates = planMove(
      board.columns,
      parsed.data.columnId,
      parsed.data.previousColumnId,
    );
    if (!updates) {
      return COLUMN_GONE;
    }

    await Promise.all(
      updates.map(async ({ id, position }) =>
        tx.column.update({ where: { id }, data: { position } }),
      ),
    );
    return null;
  });

  revalidateWorkspace(actor.slug);
  return failure ?? { status: "success", data: undefined };
}
