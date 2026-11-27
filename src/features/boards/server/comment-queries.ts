import "server-only";
import { COMMENT_PAGE_SIZE } from "@/features/boards/lib/comment-schemas";
import {
  toCardComment,
  type CommentPage,
  type CommentViewer,
} from "@/features/boards/lib/card-comment";
import { db } from "@/server/db";

export const COMMENT_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  editedAt: true,
  author: { select: { id: true, name: true } },
} as const;

export async function getCardComments(
  viewer: CommentViewer,
  ref: { boardId: string; cardId: string },
  before: string | null,
): Promise<CommentPage | null> {
  const card = await db.card.findUnique({
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
