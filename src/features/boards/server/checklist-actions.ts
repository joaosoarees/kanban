"use server";

import * as z from "zod";
import {
  checklistItemSchema,
  MAX_CHECKLIST_ITEMS,
  moveChecklistItemSchema,
} from "@/features/boards/lib/checklist-schemas";
import {
  positionAtEnd,
  positionInColumn,
} from "@/features/boards/lib/position";
import {
  CARD_GONE,
  CHECKLIST_ITEM_GONE,
  lockCard,
  parseCardRef,
} from "@/features/boards/server/access";
import {
  loadActorAllowedTo,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import {
  FORBIDDEN,
  INVALID,
  invalidFields,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";

const CHECKLIST_LIMIT: ActionError = {
  status: "error",
  message: `Um card pode ter no máximo ${MAX_CHECKLIST_ITEMS} itens.`,
};

const CHECKLIST_CHANGED: ActionError = {
  status: "error",
  message: "O checklist mudou enquanto você movia o item. Tente de novo.",
};

const SUCCESS = { status: "success", data: undefined } as const;

function parseItemId(itemId: unknown) {
  const parsed = z.uuid().safeParse(itemId);
  return parsed.success ? parsed.data : null;
}

function itemScope(
  ref: { boardId: string; cardId: string },
  itemId: string,
  workspaceId: string,
) {
  return {
    id: itemId,
    cardId: ref.cardId,
    card: { column: { boardId: ref.boardId, board: { workspaceId } } },
  };
}

async function goneResult(
  ref: { boardId: string; cardId: string },
  workspaceId: string,
): Promise<ActionError> {
  const card = await db.card.findUnique({
    where: {
      id: ref.cardId,
      column: { boardId: ref.boardId, board: { workspaceId } },
    },
    select: { id: true },
  });
  return card ? CHECKLIST_ITEM_GONE : CARD_GONE;
}

export async function createChecklistItemAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseCardRef(boardId, cardId);
  if (!ref) {
    return CARD_GONE;
  }

  const parsed = checklistItemSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const result = await db.$transaction(async (tx) => {
    if (!(await lockCard(tx, actor.workspaceId, ref))) {
      return CARD_GONE;
    }

    const items = await tx.checklistItem.findMany({
      where: { cardId: ref.cardId },
      orderBy: { position: "asc" },
      select: { id: true, position: true },
    });
    if (items.length >= MAX_CHECKLIST_ITEMS) {
      return CHECKLIST_LIMIT;
    }

    const item = await tx.checklistItem.create({
      data: {
        cardId: ref.cardId,
        text: parsed.data.text,
        position: positionAtEnd(items),
      },
      select: { id: true },
    });
    return { status: "success" as const, data: item };
  });

  revalidateWorkspace(actor.slug);
  return result;
}

export async function updateChecklistItemAction(
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
  const itemRef = parseItemId(itemId);
  if (itemRef === null) {
    return CHECKLIST_ITEM_GONE;
  }

  const parsed = checklistItemSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const { count } = await db.checklistItem.updateMany({
    where: itemScope(ref, itemRef, actor.workspaceId),
    data: { text: parsed.data.text },
  });

  revalidateWorkspace(actor.slug);
  return count === 0 ? goneResult(ref, actor.workspaceId) : SUCCESS;
}

export async function moveChecklistItemAction(
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

  const parsed = moveChecklistItemSchema.safeParse(input);
  if (!parsed.success) {
    return INVALID;
  }
  const { itemId, previousItemId } = parsed.data;

  const failure = await db.$transaction(async (tx) => {
    if (!(await lockCard(tx, actor.workspaceId, ref))) {
      return CARD_GONE;
    }

    const items = await tx.checklistItem.findMany({
      where: { cardId: ref.cardId },
      orderBy: { position: "asc" },
      select: { id: true, position: true },
    });
    if (!items.some(({ id }) => id === itemId)) {
      return CHECKLIST_ITEM_GONE;
    }

    const position = positionInColumn(items, itemId, previousItemId);
    if (position === null) {
      return CHECKLIST_CHANGED;
    }

    await tx.checklistItem.update({
      where: { id: itemId },
      data: { position },
    });
    return null;
  });

  revalidateWorkspace(actor.slug);
  return failure ?? SUCCESS;
}

export async function deleteChecklistItemAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  itemId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseCardRef(boardId, cardId);
  if (!ref) {
    return CARD_GONE;
  }
  const itemRef = parseItemId(itemId);
  if (itemRef === null) {
    return SUCCESS;
  }

  const { count } = await db.checklistItem.deleteMany({
    where: itemScope(ref, itemRef, actor.workspaceId),
  });

  revalidateWorkspace(actor.slug);
  if (count > 0) {
    return SUCCESS;
  }
  const gone = await goneResult(ref, actor.workspaceId);
  return gone === CARD_GONE ? CARD_GONE : SUCCESS;
}
