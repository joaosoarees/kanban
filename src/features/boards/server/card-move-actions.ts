"use server";

import { moveCardSchema } from "@/features/boards/lib/card-schemas";
import { positionInColumn } from "@/features/boards/lib/position";
import {
  BOARD_GONE,
  CARD_GONE,
  COLUMN_GONE,
  lockBoard,
} from "@/features/boards/server/access";
import { recordActivity } from "@/features/boards/server/activity";
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
import { transact } from "@/server/transaction";

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

  const failure = await transact(async (tx) => {
    const lockedBoardId = await lockBoard(tx, actor.workspaceId, boardId);
    if (lockedBoardId === null) {
      return BOARD_GONE;
    }

    const card = await tx.card.findUnique({
      where: { id: cardId, column: { boardId: lockedBoardId } },
      select: { columnId: true, column: { select: { name: true } } },
    });
    if (!card) {
      return CARD_GONE;
    }

    const column = await tx.column.findUnique({
      where: { id: columnId, boardId: lockedBoardId },
      select: {
        id: true,
        name: true,
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
    if (card.columnId !== column.id) {
      await recordActivity(tx, actor.userId, cardId, {
        type: "CARD_MOVED",
        from: card.column.name,
        to: column.name,
      });
    }
    return null;
  });

  revalidateWorkspace(actor.slug);
  return failure ?? { status: "success", data: undefined };
}
