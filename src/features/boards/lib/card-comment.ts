import { can } from "@/features/workspaces/lib/permissions";
import type { Role } from "@/generated/prisma/enums";

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

export type CommentRow = {
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
