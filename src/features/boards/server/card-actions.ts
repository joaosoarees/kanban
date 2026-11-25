"use server";

import * as z from "zod";
import {
  cardDescriptionSchema,
  cardTitleSchema,
  createCardSchema,
} from "@/features/boards/lib/card-schemas";
import { cardAssigneeSchema } from "@/features/boards/lib/label-schemas";
import { positionAtEnd } from "@/features/boards/lib/position";
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
  invalidFields,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";

const MEMBER_GONE: ActionError = {
  status: "error",
  message: "Essa pessoa não faz mais parte do workspace.",
};

function parseCardRef(boardId: unknown, cardId: unknown) {
  const board = z.uuid().safeParse(boardId);
  const card = z.uuid().safeParse(cardId);
  if (!board.success || !card.success) {
    return null;
  }
  return { boardId: board.data, cardId: card.data };
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

export async function setCardAssigneeAction(
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

  const parsed = cardAssigneeSchema.safeParse(input);
  if (!parsed.success) {
    return INVALID;
  }
  const { assigneeId } = parsed.data;

  const failure = await db.$transaction(async (tx) => {
    if (assigneeId !== null) {
      const member = await tx.$queryRaw<{ userId: string }[]>`
        SELECT "userId" FROM memberships
        WHERE "userId" = ${assigneeId}::uuid
          AND "workspaceId" = ${actor.workspaceId}::uuid
        FOR KEY SHARE
      `;
      if (member.length === 0) {
        return MEMBER_GONE;
      }
    }

    const { count } = await tx.card.updateMany({
      where: {
        id: ref.cardId,
        column: {
          boardId: ref.boardId,
          board: { workspaceId: actor.workspaceId },
        },
      },
      data: { assigneeId },
    });
    return count === 0 ? CARD_GONE : null;
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
