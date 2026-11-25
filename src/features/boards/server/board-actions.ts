"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { boardNameSchema } from "@/features/boards/lib/board-schemas";
import { initialPositions } from "@/features/boards/lib/position";
import { BOARD_GONE } from "@/features/boards/server/access";
import {
  loadActorAllowedTo,
  recheckActor,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import {
  FORBIDDEN,
  invalidFields,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";

const DEFAULT_COLUMNS = ["A fazer", "Fazendo", "Feito"];

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
  const created = await db.$transaction(async (tx) => {
    const denied = await recheckActor(tx, actor, "manageBoards");
    if (denied) {
      return denied;
    }
    return tx.board.create({
      data: {
        workspaceId: actor.workspaceId,
        name: parsed.data.name,
        columns: {
          create: DEFAULT_COLUMNS.map((columnName, index) => ({
            name: columnName,
            position: positions[index],
          })),
        },
      },
      select: { id: true },
    });
  });
  if ("status" in created) {
    return created;
  }

  revalidateWorkspace(actor.slug);
  return redirect(`/w/${actor.slug}/b/${created.id}`);
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

  const refused = await db.$transaction(async (tx) => {
    const denied = await recheckActor(tx, actor, "manageBoards");
    if (denied) {
      return denied;
    }
    const { count } = await tx.board.updateMany({
      where: { id: id.data, workspaceId: actor.workspaceId },
      data: { name: parsed.data.name },
    });
    return count === 0 ? BOARD_GONE : null;
  });

  revalidateWorkspace(actor.slug);
  return refused ?? { status: "success", data: undefined };
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

  const refused = await db.$transaction(async (tx) => {
    const denied = await recheckActor(tx, actor, "manageBoards");
    if (denied) {
      return denied;
    }
    await tx.board.deleteMany({
      where: { id: id.data, workspaceId: actor.workspaceId },
    });
    return null;
  });
  if (refused) {
    return refused;
  }

  revalidateWorkspace(actor.slug);
  return redirect(`/w/${actor.slug}`);
}
