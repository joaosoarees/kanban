"use server";

import * as z from "zod";
import { checklistItemCompletionSchema } from "@/features/boards/lib/checklist-schemas";
import {
  CARD_GONE,
  CHECKLIST_ITEM_GONE,
  lockCard,
  parseCardRef,
} from "@/features/boards/server/access";
import { recordActivity } from "@/features/boards/server/activity";
import {
  loadActorAllowedTo,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import { FORBIDDEN, INVALID, type ActionResult } from "@/lib/action-result";
import { db } from "@/server/db";

const SUCCESS = { status: "success", data: undefined } as const;

export async function setChecklistItemCompletionAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  itemId: unknown,
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
  const itemRef = z.uuid().safeParse(itemId);
  if (!itemRef.success) {
    return CHECKLIST_ITEM_GONE;
  }

  const parsed = checklistItemCompletionSchema.safeParse(input);
  if (!parsed.success) {
    return INVALID;
  }

  const { completed } = parsed.data;

  const failure = await db.$transaction(async (tx) => {
    if (!(await lockCard(tx, actor.workspaceId, ref))) {
      return CARD_GONE;
    }
    const item = await tx.checklistItem.findUnique({
      where: { id: itemRef.data, cardId: ref.cardId },
      select: { text: true, completedAt: true },
    });
    if (!item) {
      return CHECKLIST_ITEM_GONE;
    }
    if ((item.completedAt !== null) === completed) {
      return null;
    }

    const updated = await tx.$executeRaw`
      UPDATE checklist_items
      SET "completedAt" = CASE WHEN ${completed}::boolean THEN now() END
      WHERE id = ${itemRef.data}::uuid
    `;
    if (updated === 0) {
      return CHECKLIST_ITEM_GONE;
    }
    await recordActivity(tx, actor.userId, ref.cardId, {
      type: "CHECKLIST_ITEM_COMPLETION_CHANGED",
      text: item.text,
      completed,
    });
    return null;
  });

  revalidateWorkspace(actor.slug);
  return failure ?? SUCCESS;
}
