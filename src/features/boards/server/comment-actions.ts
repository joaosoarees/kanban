"use server";

import * as z from "zod";
import { commentSchema } from "@/features/boards/lib/comment-schemas";
import {
  CARD_GONE,
  COMMENT_GONE,
  parseCardRef,
} from "@/features/boards/server/access";
import {
  COMMENT_SELECT,
  toCardComment,
  type CardComment,
} from "@/features/boards/server/comment-queries";
import {
  loadActorAllowedTo,
  recheckActor,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import { Prisma } from "@/generated/prisma/client";
import {
  FORBIDDEN,
  invalidFields,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";

function cardScope(
  ref: { boardId: string; cardId: string },
  workspaceId: string,
) {
  return {
    id: ref.cardId,
    column: { boardId: ref.boardId, board: { workspaceId } },
  };
}

export async function createCommentAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  input: unknown,
): Promise<ActionResult<CardComment>> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseCardRef(boardId, cardId);
  if (!ref) {
    return CARD_GONE;
  }

  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const card = await db.card.findFirst({
    where: cardScope(ref, actor.workspaceId),
    select: { id: true },
  });
  if (!card) {
    return CARD_GONE;
  }

  try {
    const comment = await db.comment.create({
      data: { cardId: card.id, authorId: actor.userId, body: parsed.data.body },
      select: COMMENT_SELECT,
    });
    revalidateWorkspace(actor.slug);
    return { status: "success", data: toCardComment(actor, comment) };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return CARD_GONE;
    }
    throw error;
  }
}

export async function editCommentAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  commentId: unknown,
  input: unknown,
): Promise<ActionResult<CardComment>> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseCardRef(boardId, cardId);
  const id = z.uuid().safeParse(commentId);
  if (!ref || !id.success) {
    return COMMENT_GONE;
  }

  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const updated = await db.comment.updateManyAndReturn({
    where: {
      id: id.data,
      authorId: actor.userId,
      card: cardScope(ref, actor.workspaceId),
    },
    data: { body: parsed.data.body, editedAt: new Date() },
    select: COMMENT_SELECT,
  });
  const comment = updated.at(0);
  if (comment === undefined) {
    return COMMENT_GONE;
  }

  return { status: "success", data: toCardComment(actor, comment) };
}

export async function deleteCommentAction(
  workspaceId: unknown,
  boardId: unknown,
  cardId: unknown,
  commentId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return FORBIDDEN;
  }

  const ref = parseCardRef(boardId, cardId);
  const id = z.uuid().safeParse(commentId);
  if (!ref || !id.success) {
    return COMMENT_GONE;
  }

  const result = await db.$transaction(async (tx): Promise<ActionResult> => {
    const comment = await tx.comment.findFirst({
      where: { id: id.data, card: cardScope(ref, actor.workspaceId) },
      select: { authorId: true },
    });
    if (!comment) {
      return COMMENT_GONE;
    }

    if (comment.authorId !== actor.userId) {
      const denied = await recheckActor(tx, actor, "deleteAnyComment");
      if (denied) {
        return denied;
      }
    }

    const { count } = await tx.comment.deleteMany({ where: { id: id.data } });
    return count === 0 ? COMMENT_GONE : { status: "success", data: undefined };
  });

  if (result.status === "success") {
    revalidateWorkspace(actor.slug);
  }
  return result;
}
