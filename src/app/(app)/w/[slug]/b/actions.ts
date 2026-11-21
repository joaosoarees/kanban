"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import type { Prisma } from "@/generated/prisma/client";
import {
  FORBIDDEN,
  invalidFields,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import {
  boardNameSchema,
  columnNameSchema,
  moveColumnSchema,
} from "@/lib/board-schemas";
import { COLUMN_ORDER } from "@/lib/boards";
import { db } from "@/lib/db";
import { initialPositions, planMove, positionAtEnd } from "@/lib/position";
import { loadActorAllowedTo } from "@/lib/workspaces";

const DEFAULT_COLUMNS = ["A fazer", "Fazendo", "Feito"];

const BOARD_GONE: ActionError = {
  status: "error",
  message: "Esse quadro não existe mais.",
};

const COLUMN_GONE: ActionError = {
  status: "error",
  message: "Essa coluna não existe mais.",
};

function revalidateWorkspace(slug: string) {
  revalidatePath(`/w/${slug}`, "layout");
}

async function lockBoardColumns(
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
  if (locked.length === 0) {
    return null;
  }

  const columns = await tx.column.findMany({
    where: { boardId: id.data },
    orderBy: [...COLUMN_ORDER],
    select: { id: true, position: true },
  });
  return { id: id.data, columns };
}

function parseColumnRef(boardId: unknown, columnId: unknown) {
  const board = z.uuid().safeParse(boardId);
  const column = z.uuid().safeParse(columnId);
  if (!board.success || !column.success) {
    return null;
  }
  return { boardId: board.data, columnId: column.data };
}

export async function createBoardAction(
  workspaceId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageBoards");
  if (!actor) {
    return FORBIDDEN;
  }

  const parsed = boardNameSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const positions = initialPositions(DEFAULT_COLUMNS.length);
  const board = await db.board.create({
    data: {
      workspaceId: actor.workspaceId,
      name: parsed.data.name,
      columns: {
        create: DEFAULT_COLUMNS.map((name, index) => ({
          name,
          position: positions[index],
        })),
      },
    },
    select: { id: true },
  });

  revalidateWorkspace(actor.slug);
  return redirect(`/w/${actor.slug}/b/${board.id}`);
}

export async function renameBoardAction(
  workspaceId: unknown,
  boardId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageBoards");
  if (!actor) {
    return FORBIDDEN;
  }

  const id = z.uuid().safeParse(boardId);
  if (!id.success) {
    return BOARD_GONE;
  }

  const parsed = boardNameSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const { count } = await db.board.updateMany({
    where: { id: id.data, workspaceId: actor.workspaceId },
    data: { name: parsed.data.name },
  });

  revalidateWorkspace(actor.slug);
  return count === 0 ? BOARD_GONE : { status: "success", data: undefined };
}

export async function deleteBoardAction(
  workspaceId: unknown,
  boardId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageBoards");
  if (!actor) {
    return FORBIDDEN;
  }

  const id = z.uuid().safeParse(boardId);
  if (!id.success) {
    return BOARD_GONE;
  }

  await db.board.deleteMany({
    where: { id: id.data, workspaceId: actor.workspaceId },
  });

  revalidateWorkspace(actor.slug);
  return redirect(`/w/${actor.slug}`);
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
    return COLUMN_GONE;
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
