"use server";

import {
  cardCompletionSchema,
  cardDueSchema,
} from "@/features/boards/lib/card-schemas";
import { isoDateOf } from "@/features/boards/lib/card-activity";
import {
  CARD_GONE,
  lockCard,
  parseCardRef,
} from "@/features/boards/server/access";
import { recordActivity } from "@/features/boards/server/activity";
import {
  loadActorAllowedTo,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import { FORBIDDEN, INVALID, type ActionResult } from "@/lib/action-result";
import { transact } from "@/server/transaction";

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

  const failure = await transact(async (tx) => {
    if (!(await lockCard(tx, actor.workspaceId, ref))) {
      return CARD_GONE;
    }
    const current = await tx.card.findUniqueOrThrow({
      where: { id: ref.cardId },
      select: { dueOn: true },
    });
    const previousDue = isoDateOf(current.dueOn);
    if (previousDue === dueOn) {
      return null;
    }

    await tx.card.update({
      where: { id: ref.cardId },
      data: { dueOn: dueOn === null ? null : new Date(`${dueOn}T00:00:00Z`) },
      select: { id: true },
    });
    await recordActivity(tx, actor.userId, ref.cardId, {
      type: "DUE_CHANGED",
      from: previousDue,
      to: dueOn,
    });
    return null;
  });

  revalidateWorkspace(actor.slug);
  return failure ?? { status: "success", data: undefined };
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

  const failure = await transact(async (tx) => {
    if (!(await lockCard(tx, actor.workspaceId, ref))) {
      return CARD_GONE;
    }
    const current = await tx.card.findUniqueOrThrow({
      where: { id: ref.cardId },
      select: { completedAt: true },
    });
    if ((current.completedAt !== null) === completed) {
      return null;
    }

    await tx.$executeRaw`
      UPDATE cards
      SET "completedAt" = CASE WHEN ${completed}::boolean THEN now() END
      WHERE id = ${ref.cardId}::uuid
    `;
    await recordActivity(tx, actor.userId, ref.cardId, {
      type: "COMPLETION_CHANGED",
      completed,
    });
    return null;
  });

  revalidateWorkspace(actor.slug);
  return failure ?? { status: "success", data: undefined };
}
