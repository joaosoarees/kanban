"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import {
  FORBIDDEN,
  invalidFields,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { boardNameSchema } from "@/lib/board-schemas";
import { db } from "@/lib/db";
import { initialPositions } from "@/lib/position";
import { loadActorAllowedTo } from "@/lib/workspaces";

const DEFAULT_COLUMNS = ["A fazer", "Fazendo", "Feito"];

const BOARD_GONE: ActionError = {
  status: "error",
  message: "Esse quadro não existe mais.",
};

function revalidateWorkspace(slug: string) {
  revalidatePath(`/w/${slug}`, "layout");
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
