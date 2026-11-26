import "server-only";
import { COMMENT_PAGE_SIZE } from "@/features/boards/lib/comment-schemas";
import { can } from "@/features/workspaces/lib/permissions";
import type { Role } from "@/generated/prisma/enums";
import { db } from "@/server/db";

export type CommentViewer = { userId: string; workspaceId: string; role: Role };

export type CardComment = {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  author: { id: string; name: string } | null;
  canEdit: boolean;
  canDelete: boolean;
};

export type CommentPage = {
  comments: CardComment[];
  nextCursor: string | null;
};

export const COMMENT_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  editedAt: true,
  author: { select: { id: true, name: true } },
} as const;

type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  author: { id: string; name: string } | null;
};

export function toCardComment(
  viewer: CommentViewer,
  comment: CommentRow,
): CardComment {
  const isAuthor = comment.author?.id === viewer.userId;
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    editedAt: comment.editedAt?.toISOString() ?? null,
    author: comment.author,
    canEdit: isAuthor,
    canDelete: isAuthor || can(viewer.role, "deleteAnyComment"),
  };
}

export async function getCardComments(
  viewer: CommentViewer,
  ref: { boardId: string; cardId: string },
  before: string | null,
): Promise<CommentPage | null> {
  const card = await db.card.findFirst({
    where: {
      id: ref.cardId,
      column: {
        boardId: ref.boardId,
        board: { workspaceId: viewer.workspaceId },
      },
    },
    select: { id: true },
  });
  if (!card) {
    return null;
  }

  const rows = await db.comment.findMany({
    where: {
      cardId: card.id,
      ...(before === null ? {} : { id: { lt: before } }),
    },
    orderBy: { id: "desc" },
    take: COMMENT_PAGE_SIZE + 1,
    select: COMMENT_SELECT,
  });

  const page = rows.slice(0, COMMENT_PAGE_SIZE);
  const last = page.at(-1);
  return {
    comments: page.map((comment) => toCardComment(viewer, comment)),
    nextCursor: rows.length > COMMENT_PAGE_SIZE && last ? last.id : null,
  };
}
