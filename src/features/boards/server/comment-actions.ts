"use server";

import * as z from "zod";
import { commentSchema } from "@/features/boards/lib/comment-schemas";
import {
  CARD_GONE,
  COMMENT_GONE,
  parseCardRef,
} from "@/features/boards/server/access";
import {
  toCardComment,
  type CardComment,
} from "@/features/boards/lib/card-comment";
import { COMMENT_SELECT } from "@/features/boards/server/comment-queries";
import {
  loadActorAllowedTo,
  recheckActor,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import {
  FORBIDDEN,
  invalidFields,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";
import { isForeignKeyViolation } from "@/server/prisma-errors";

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

  const card = await db.card.findUnique({
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
    if (isForeignKeyViolation(error, "comments_cardId_fkey")) {
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

  const edited = await db.$queryRaw<{ id: string }[]>`
    UPDATE comments AS comment
    SET body = ${parsed.data.body},
      "editedAt" = GREATEST(now(), comment."createdAt")
    FROM cards card
    JOIN columns board_column ON board_column.id = card."columnId"
    JOIN boards board ON board.id = board_column."boardId"
    WHERE comment.id = ${id.data}::uuid
      AND comment."authorId" = ${actor.userId}::uuid
      AND card.id = comment."cardId"
      AND card.id = ${ref.cardId}::uuid
      AND board_column."boardId" = ${ref.boardId}::uuid
      AND board."workspaceId" = ${actor.workspaceId}::uuid
    RETURNING comment.id
  `;
  if (edited.length === 0) {
    revalidateWorkspace(actor.slug);
    return COMMENT_GONE;
  }

  const comment = await db.comment.findUnique({
    where: { id: id.data },
    select: COMMENT_SELECT,
  });
  if (!comment) {
    revalidateWorkspace(actor.slug);
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
    const comment = await tx.comment.findUnique({
      where: { id: id.data, card: cardScope(ref, actor.workspaceId) },
      select: { authorId: true },
    });
    if (!comment) {
      return COMMENT_GONE;
    }

    const denied = await recheckActor(
      tx,
      actor,
      comment.authorId === actor.userId ? "manageCards" : "deleteAnyComment",
    );
    if (denied) {
      return denied;
    }

    const { count } = await tx.comment.deleteMany({ where: { id: id.data } });
    return count === 0 ? COMMENT_GONE : { status: "success", data: undefined };
  });

  if (result.status === "success" || result.gone === true) {
    revalidateWorkspace(actor.slug);
  }
  return result;
}
