"use server";

import * as z from "zod";
import {
  FORBIDDEN,
  invalidFields,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { BOARD_GONE, CARD_GONE, lockBoard } from "@/lib/boards";
import { db } from "@/lib/db";
import {
  LABEL_GONE_MESSAGE,
  labelSchema,
  MAX_LABELS_PER_BOARD,
  MAX_LABELS_PER_CARD,
} from "@/lib/label-schemas";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { loadActorAllowedTo, revalidateWorkspace } from "@/lib/workspaces";

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

const CARD_LABEL_LIMIT: ActionError = {
  status: "error",
  message: `Um card pode ter no máximo ${MAX_LABELS_PER_CARD} etiquetas.`,
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
    if (lockedBoardId !== null) {
      await tx.label.deleteMany({
        where: { id: labelRef, boardId: lockedBoardId },
      });
    }
  });

  revalidateWorkspace(actor.slug);
  return SUCCESS;
}

export async function addCardLabelAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  labelId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const cardRef = parseId(cardId);
  const labelRef = parseId(labelId);
  if (cardRef === null) {
    return CARD_GONE;
  }
  if (labelRef === null) {
    return LABEL_GONE;
  }

  const failure = await db.$transaction(async (tx) => {
    const lockedBoardId = await lockBoard(tx, actor.workspaceId, boardId);
    if (lockedBoardId === null) {
      return BOARD_GONE;
    }

    const inserted = await tx.$executeRaw`
      INSERT INTO card_labels ("cardId", "labelId")
      SELECT card.id, label.id
      FROM cards card
      JOIN columns board_column ON board_column.id = card."columnId"
      JOIN labels label ON label."boardId" = board_column."boardId"
      WHERE card.id = ${cardRef}::uuid
        AND label.id = ${labelRef}::uuid
        AND board_column."boardId" = ${lockedBoardId}::uuid
        AND (
          SELECT count(*) FROM card_labels applied
          WHERE applied."cardId" = card.id
        ) < ${MAX_LABELS_PER_CARD}
      ON CONFLICT DO NOTHING
    `;
    if (inserted > 0) {
      return null;
    }

    const card = await tx.card.findFirst({
      where: { id: cardRef, column: { boardId: lockedBoardId } },
      select: {
        labels: { where: { labelId: labelRef }, select: { labelId: true } },
      },
    });
    if (!card) {
      return CARD_GONE;
    }
    if (card.labels.length > 0) {
      return null;
    }

    const label = await tx.label.findFirst({
      where: { id: labelRef, boardId: lockedBoardId },
      select: { id: true },
    });
    return label ? CARD_LABEL_LIMIT : LABEL_GONE;
  });

  revalidateWorkspace(actor.slug);
  return failure ?? SUCCESS;
}

export async function removeCardLabelAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  labelId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const boardRef = parseId(boardId);
  const cardRef = parseId(cardId);
  const labelRef = parseId(labelId);
  if (boardRef === null) {
    return BOARD_GONE;
  }
  if (cardRef === null) {
    return CARD_GONE;
  }
  if (labelRef === null) {
    return LABEL_GONE;
  }

  await db.cardLabel.deleteMany({
    where: {
      cardId: cardRef,
      labelId: labelRef,
      label: {
        boardId: boardRef,
        board: { workspaceId: actor.workspaceId },
      },
    },
  });

  revalidateWorkspace(actor.slug);
  return SUCCESS;
}
