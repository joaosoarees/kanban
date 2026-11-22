"use server";

import * as z from "zod";
import {
  FORBIDDEN,
  INVALID,
  invalidFields,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { BOARD_GONE, COLUMN_GONE, lockBoard } from "@/lib/boards";
import {
  cardDescriptionSchema,
  cardTitleSchema,
  createCardSchema,
  moveCardSchema,
} from "@/lib/card-schemas";
import { db } from "@/lib/db";
import { positionAtEnd, positionInColumn } from "@/lib/position";
import { loadActorAllowedTo, revalidateWorkspace } from "@/lib/workspaces";

const CARD_GONE: ActionError = {
  status: "error",
  message: "Esse card não existe mais. O quadro foi atualizado.",
  gone: true,
};

const BOARD_CHANGED: ActionError = {
  status: "error",
  message: "O quadro mudou enquanto você movia o card. Tente de novo.",
};

function parseCardRef(boardId: unknown, cardId: unknown) {
  const board = z.uuid().safeParse(boardId);
  const card = z.uuid().safeParse(cardId);
  if (!board.success || !card.success) {
    return null;
  }
  return { boardId: board.data, cardId: card.data };
}

export async function getCardDescriptionAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
): Promise<ActionResult<{ description: string | null }>> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseCardRef(boardId, cardId);
  if (!ref) {
    return CARD_GONE;
  }

  const card = await db.card.findFirst({
    where: {
      id: ref.cardId,
      column: {
        boardId: ref.boardId,
        board: { workspaceId: actor.workspaceId },
      },
    },
    select: { description: true },
  });
  return card ? { status: "success", data: card } : CARD_GONE;
}

export async function createCardAction(
  workspaceId: unknown,
  boardId: unknown,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const parsed = createCardSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const result = await db.$transaction(async (tx) => {
    const lockedBoardId = await lockBoard(tx, actor.workspaceId, boardId);
    if (lockedBoardId === null) {
      return BOARD_GONE;
    }

    const column = await tx.column.findFirst({
      where: { id: parsed.data.columnId, boardId: lockedBoardId },
      select: { id: true },
    });
    if (!column) {
      return COLUMN_GONE;
    }

    const lastCard = await tx.card.findFirst({
      where: { columnId: column.id },
      orderBy: { position: "desc" },
      select: { id: true, position: true },
    });

    const card = await tx.card.create({
      data: {
        columnId: column.id,
        title: parsed.data.title,
        position: positionAtEnd(lastCard ? [lastCard] : []),
      },
      select: { id: true },
    });
    return { status: "success" as const, data: card };
  });

  revalidateWorkspace(actor.slug);
  return result;
}

type CardTextUpdate = { title: string } | { description: string | null };

async function updateCard(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  parseData: () => ActionError | CardTextUpdate,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseCardRef(boardId, cardId);
  if (!ref) {
    return CARD_GONE;
  }

  const data = parseData();
  if ("status" in data) {
    return data;
  }

  const { count } = await db.card.updateMany({
    where: {
      id: ref.cardId,
      column: {
        boardId: ref.boardId,
        board: { workspaceId: actor.workspaceId },
      },
    },
    data,
  });

  revalidateWorkspace(actor.slug);
  return count === 0 ? CARD_GONE : { status: "success", data: undefined };
}

export async function renameCardAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  input: unknown,
): Promise<ActionResult> {
  return updateCard(workspaceId, boardId, cardId, () => {
    const parsed = cardTitleSchema.safeParse(input);
    return parsed.success ? parsed.data : invalidFields(parsed.error);
  });
}

export async function updateCardDescriptionAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  input: unknown,
): Promise<ActionResult> {
  return updateCard(workspaceId, boardId, cardId, () => {
    const parsed = cardDescriptionSchema.safeParse(input);
    return parsed.success ? parsed.data : invalidFields(parsed.error);
  });
}

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

export async function deleteCardAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseCardRef(boardId, cardId);
  if (!ref) {
    return CARD_GONE;
  }

  await db.$transaction(async (tx) => {
    const lockedBoardId = await lockBoard(tx, actor.workspaceId, ref.boardId);
    if (lockedBoardId !== null) {
      await tx.card.deleteMany({
        where: { id: ref.cardId, column: { boardId: lockedBoardId } },
      });
    }
  });

  revalidateWorkspace(actor.slug);
  return { status: "success", data: undefined };
}
