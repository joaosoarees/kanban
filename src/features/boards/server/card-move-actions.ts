"use server";

import { moveCardSchema } from "@/features/boards/lib/card-schemas";
import { positionInColumn } from "@/features/boards/lib/position";
import {
  BOARD_GONE,
  CARD_GONE,
  COLUMN_GONE,
  lockBoard,
} from "@/features/boards/server/access";
import {
  loadActorAllowedTo,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import {
  FORBIDDEN,
  INVALID,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";

const BOARD_CHANGED: ActionError = {
  status: "error",
  message: "O quadro mudou enquanto você movia o card. Tente de novo.",
};

export async function moveCardAction(
  workspaceId: unknown,
  boardId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const parsed = moveCardSchema.safeParse(input);
  if (!parsed.success) {
    return INVALID;
  }
  const { cardId, columnId, previousCardId } = parsed.data;

  const failure = await db.$transaction(async (tx) => {
    const lockedBoardId = await lockBoard(tx, actor.workspaceId, boardId);
    if (lockedBoardId === null) {
      return BOARD_GONE;
    }

    const card = await tx.card.findFirst({
      where: { id: cardId, column: { boardId: lockedBoardId } },
      select: { id: true },
    });
    if (!card) {
      return CARD_GONE;
    }

    const column = await tx.column.findFirst({
      where: { id: columnId, boardId: lockedBoardId },
      select: {
        id: true,
        cards: {
          orderBy: { position: "asc" },
          select: { id: true, position: true },
        },
      },
    });
    if (!column) {
      return COLUMN_GONE;
    }

    const position = positionInColumn(column.cards, cardId, previousCardId);
    if (position === null) {
      return BOARD_CHANGED;
    }

    await tx.card.update({
      where: { id: cardId },
      data: { columnId: column.id, position },
    });
    return null;
  });

  revalidateWorkspace(actor.slug);
  return failure ?? { status: "success", data: undefined };
}
