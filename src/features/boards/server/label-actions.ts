"use server";

import * as z from "zod";
import {
  LABEL_GONE_MESSAGE,
  labelSchema,
  MAX_LABELS_PER_BOARD,
} from "@/features/boards/lib/label-schemas";
import { BOARD_GONE, lockBoard } from "@/features/boards/server/access";
import { recordActivities } from "@/features/boards/server/activity";
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
import { isUniqueViolation } from "@/server/prisma-errors";

const LABEL_GONE: ActionError = {
  status: "error",
  message: LABEL_GONE_MESSAGE,
};

const NAME_TAKEN_MESSAGE = "Já existe uma etiqueta com esse nome.";

const NAME_TAKEN: ActionError = {
  status: "error",
  message: NAME_TAKEN_MESSAGE,
  fieldErrors: { name: [NAME_TAKEN_MESSAGE] },
};

const BOARD_LABEL_LIMIT: ActionError = {
  status: "error",
  message: `Um quadro pode ter no máximo ${MAX_LABELS_PER_BOARD} etiquetas.`,
};

const SUCCESS = { status: "success", data: undefined } as const;

function parseId(id: unknown) {
  const parsed = z.uuid().safeParse(id);
  return parsed.success ? parsed.data : null;
}

async function refusingTakenName<T>(
  write: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NAME_TAKEN;
    }
    throw error;
  }
}

export async function createLabelAction(
  workspaceId: unknown,
  boardId: unknown,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const parsed = labelSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const result = await refusingTakenName(async () =>
    db.$transaction(async (tx) => {
      const lockedBoardId = await lockBoard(tx, actor.workspaceId, boardId);
      if (lockedBoardId === null) {
        return BOARD_GONE;
      }

      const total = await tx.label.count({ where: { boardId: lockedBoardId } });
      if (total >= MAX_LABELS_PER_BOARD) {
        return BOARD_LABEL_LIMIT;
      }

      const label = await tx.label.create({
        data: { boardId: lockedBoardId, ...parsed.data },
        select: { id: true },
      });
      return { status: "success" as const, data: label };
    }),
  );

  revalidateWorkspace(actor.slug);
  return result;
}

export async function updateLabelAction(
  workspaceId: unknown,
  boardId: unknown,
  labelId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const boardRef = parseId(boardId);
  const labelRef = parseId(labelId);
  if (boardRef === null) {
    return BOARD_GONE;
  }
  if (labelRef === null) {
    return LABEL_GONE;
  }

  const parsed = labelSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const result = await refusingTakenName<undefined>(async () => {
    const { count } = await db.label.updateMany({
      where: {
        id: labelRef,
        boardId: boardRef,
        board: { workspaceId: actor.workspaceId },
      },
      data: parsed.data,
    });
    return count === 0 ? LABEL_GONE : SUCCESS;
  });

  revalidateWorkspace(actor.slug);
  return result;
}

export async function deleteLabelAction(
  workspaceId: unknown,
  boardId: unknown,
  labelId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const labelRef = parseId(labelId);
  if (labelRef === null) {
    return LABEL_GONE;
  }

  await db.$transaction(async (tx) => {
    const lockedBoardId = await lockBoard(tx, actor.workspaceId, boardId);
    if (lockedBoardId === null) {
      return;
    }
    const label = await tx.label.findUnique({
      where: { id: labelRef, boardId: lockedBoardId },
      select: { name: true, color: true, cards: { select: { cardId: true } } },
    });
    if (!label) {
      return;
    }
    await tx.label.delete({ where: { id: labelRef }, select: { id: true } });
    await recordActivities(
      tx,
      label.cards.map(({ cardId }) => cardId),
      { type: "LABEL_REMOVED", name: label.name, color: label.color },
    );
  });

  revalidateWorkspace(actor.slug);
  return SUCCESS;
}
