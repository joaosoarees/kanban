"use server";

import {
  cardDescriptionSchema,
  cardTitleSchema,
  createCardSchema,
} from "@/features/boards/lib/card-schemas";
import { cardAssigneeSchema } from "@/features/boards/lib/label-schemas";
import type { CardActivityEvent } from "@/features/boards/lib/card-activity";
import { positionAtEnd } from "@/features/boards/lib/position";
import {
  BOARD_GONE,
  CARD_GONE,
  COLUMN_GONE,
  lockBoard,
  lockCard,
  parseCardRef,
} from "@/features/boards/server/access";
import { recordActivity } from "@/features/boards/server/activity";
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

    const column = await tx.column.findUnique({
      where: { id: parsed.data.columnId, boardId: lockedBoardId },
      select: { id: true, name: true },
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
    await recordActivity(tx, actor.userId, card.id, {
      type: "CARD_CREATED",
      column: column.name,
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

  const failure = await db.$transaction(async (tx) => {
    if (!(await lockCard(tx, actor.workspaceId, ref))) {
      return CARD_GONE;
    }

    const current = await tx.card.findUniqueOrThrow({
      where: { id: ref.cardId },
      select: { title: true, description: true },
    });
    const event: CardActivityEvent | null =
      "title" in data
        ? current.title === data.title
          ? null
          : { type: "TITLE_CHANGED", from: current.title, to: data.title }
        : current.description === data.description
          ? null
          : { type: "DESCRIPTION_CHANGED" };
    if (event === null) {
      return null;
    }

    await tx.card.update({
      where: { id: ref.cardId },
      data,
      select: { id: true },
    });
    await recordActivity(tx, actor.userId, ref.cardId, event);
    return null;
  });

  revalidateWorkspace(actor.slug);
  return failure ?? { status: "success", data: undefined };
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
    let assigneeName: string | null = null;
    if (assigneeId !== null) {
      const members = await tx.$queryRaw<{ name: string }[]>`
        SELECT member_user.name FROM memberships membership
        JOIN users member_user ON member_user.id = membership."userId"
        WHERE membership."userId" = ${assigneeId}::uuid
          AND membership."workspaceId" = ${actor.workspaceId}::uuid
        FOR KEY SHARE OF membership
      `;
      const member = members.at(0);
      if (member === undefined) {
        return MEMBER_GONE;
      }
      assigneeName = member.name;
    }

    if (!(await lockCard(tx, actor.workspaceId, ref))) {
      return CARD_GONE;
    }
    const current = await tx.card.findUniqueOrThrow({
      where: { id: ref.cardId },
      select: { assigneeId: true, assignee: { select: { name: true } } },
    });
    if (current.assigneeId === assigneeId) {
      return null;
    }

    await tx.card.update({
      where: { id: ref.cardId },
      data: { assigneeId },
      select: { id: true },
    });
    await recordActivity(tx, actor.userId, ref.cardId, {
      type: "ASSIGNEE_CHANGED",
      from: current.assignee?.name ?? null,
      to: assigneeName,
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
