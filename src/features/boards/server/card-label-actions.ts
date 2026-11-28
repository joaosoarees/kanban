"use server";

import * as z from "zod";
import {
  LABEL_GONE_MESSAGE,
  MAX_LABELS_PER_CARD,
} from "@/features/boards/lib/label-schemas";
import {
  BOARD_GONE,
  CARD_GONE,
  lockBoard,
} from "@/features/boards/server/access";
import { recordActivity } from "@/features/boards/server/activity";
import {
  loadActorAllowedTo,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import {
  FORBIDDEN,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";

const LABEL_GONE: ActionError = {
  status: "error",
  message: LABEL_GONE_MESSAGE,
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
      const added = await tx.label.findUniqueOrThrow({
        where: { id: labelRef },
        select: { name: true, color: true },
      });
      await recordActivity(tx, cardRef, { type: "LABEL_ADDED", ...added });
      return null;
    }

    const card = await tx.card.findUnique({
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

    const label = await tx.label.findUnique({
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
    const card = await tx.card.findUnique({
      where: { id: cardRef, column: { boardId: lockedBoardId } },
      select: {
        labels: {
          where: { labelId: labelRef },
          select: { label: { select: { name: true, color: true } } },
        },
      },
    });
    if (!card) {
      return CARD_GONE;
    }
    const applied = card.labels.at(0);
    if (applied === undefined) {
      return null;
    }
    const { count } = await tx.cardLabel.deleteMany({
      where: { cardId: cardRef, labelId: labelRef },
    });
    if (count > 0) {
      await recordActivity(tx, cardRef, {
        type: "LABEL_REMOVED",
        ...applied.label,
      });
    }
    return null;
  });

  revalidateWorkspace(actor.slug);
  return failure ?? SUCCESS;
}
