"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { initialPositions } from "@/features/boards/lib/position";
import { boardNameSchema } from "@/features/boards/lib/schemas";
import { BOARD_GONE } from "@/features/boards/server/access";
import {
  loadActorAllowedTo,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import {
  FORBIDDEN,
  invalidFields,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";
import { isForeignKeyViolation } from "@/server/prisma-errors";

const DEFAULT_COLUMNS = ["A fazer", "Fazendo", "Feito"];

const WORKSPACE_GONE: ActionError = {
  status: "error",
  message: "Esse workspace não existe mais.",
};

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

  const board = await insertBoard(actor.workspaceId, parsed.data.name);
  if (!board) {
    return WORKSPACE_GONE;
  }

  revalidateWorkspace(actor.slug);
  return redirect(`/w/${actor.slug}/b/${board.id}`);
}

async function insertBoard(workspaceId: string, name: string) {
  const positions = initialPositions(DEFAULT_COLUMNS.length);
  try {
    return await db.board.create({
      data: {
        workspaceId,
        name,
        columns: {
          create: DEFAULT_COLUMNS.map((columnName, index) => ({
            name: columnName,
            position: positions[index],
          })),
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return null;
    }
    throw error;
  }
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

  if (count === 0) {
    return BOARD_GONE;
  }

  revalidateWorkspace(actor.slug);
  return { status: "success", data: undefined };
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
