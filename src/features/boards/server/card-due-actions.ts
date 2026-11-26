"use server";

import {
  cardCompletionSchema,
  cardDueSchema,
} from "@/features/boards/lib/card-schemas";
import { CARD_GONE, parseCardRef } from "@/features/boards/server/access";
import {
  loadActorAllowedTo,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import { FORBIDDEN, INVALID, type ActionResult } from "@/lib/action-result";
import { db } from "@/server/db";

export async function setCardDueAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseCardRef(boardId, cardId);
  if (!ref) {
    return CARD_GONE;
  }

  const parsed = cardDueSchema.safeParse(input);
  if (!parsed.success) {
    return INVALID;
  }
  const { dueOn } = parsed.data;

  const { count } = await db.card.updateMany({
    where: {
      id: ref.cardId,
      column: {
        boardId: ref.boardId,
        board: { workspaceId: actor.workspaceId },
      },
    },
    data: { dueOn: dueOn === null ? null : new Date(`${dueOn}T00:00:00Z`) },
  });

  revalidateWorkspace(actor.slug);
  return count === 0 ? CARD_GONE : { status: "success", data: undefined };
}

export async function setCardCompletionAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseCardRef(boardId, cardId);
  if (!ref) {
    return CARD_GONE;
  }

  const parsed = cardCompletionSchema.safeParse(input);
  if (!parsed.success) {
    return INVALID;
  }
  const { completed } = parsed.data;

  const count = await db.$executeRaw`
    UPDATE cards AS card
    SET "completedAt" = CASE
      WHEN ${completed}::boolean THEN COALESCE(card."completedAt", now())
      ELSE NULL
    END
    FROM columns AS board_column
    JOIN boards AS board ON board.id = board_column."boardId"
    WHERE card.id = ${ref.cardId}::uuid
      AND board_column.id = card."columnId"
      AND board_column."boardId" = ${ref.boardId}::uuid
      AND board."workspaceId" = ${actor.workspaceId}::uuid
  `;

  revalidateWorkspace(actor.slug);
  return count === 0 ? CARD_GONE : { status: "success", data: undefined };
}
