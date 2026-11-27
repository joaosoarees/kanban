import { describe, expect, it } from "vitest";
import type { Role } from "@/generated/prisma/enums";
import { toCardComment, type CommentRow } from "./card-comment";

const AUTHOR = { id: "user-ana", name: "Ana Beatriz Rocha" };

function makeRow(overrides: Partial<CommentRow> = {}): CommentRow {
  return {
    id: "comment-1",
    body: "Revisar o PR",
    createdAt: new Date("2026-11-20T12:30:00.000Z"),
    editedAt: null,
    author: AUTHOR,
    ...overrides,
  };
}

function viewer(userId: string, role: Role) {
  return { userId, workspaceId: "workspace-1", role };
}

describe("toCardComment", () => {
  it("should map the row with ISO dates", () => {
    const comment = toCardComment(
      viewer("user-bruno", "MEMBER"),
      makeRow({ editedAt: new Date("2026-11-21T08:00:00.000Z") }),
    );

    expect(comment).toEqual({
      id: "comment-1",
      body: "Revisar o PR",
      createdAt: "2026-11-20T12:30:00.000Z",
      editedAt: "2026-11-21T08:00:00.000Z",
      author: AUTHOR,
      canEdit: false,
      canDelete: false,
    });
  });

  it("should keep editedAt null when the comment was never edited", () => {
    const comment = toCardComment(viewer("user-bruno", "MEMBER"), makeRow());

    expect(comment.editedAt).toBe(null);
  });

  it.each<Role>(["OWNER", "ADMIN", "MEMBER"])(
    "should let the author edit and delete as %s",
    (role) => {
      const comment = toCardComment(viewer(AUTHOR.id, role), makeRow());

      expect([comment.canEdit, comment.canDelete]).toEqual([true, true]);
    },
  );

  it.each<Role>(["OWNER", "ADMIN"])(
    "should let a %s who is not the author delete but not edit",
    (role) => {
      const comment = toCardComment(viewer("user-bruno", role), makeRow());

      expect([comment.canEdit, comment.canDelete]).toEqual([false, true]);
    },
  );

  it("should not let a member who is not the author edit or delete", () => {
    const comment = toCardComment(viewer("user-bruno", "MEMBER"), makeRow());

    expect([comment.canEdit, comment.canDelete]).toEqual([false, false]);
  });

  it("should not let anyone edit a comment whose author left", () => {
    const comment = toCardComment(
      viewer("user-ana", "MEMBER"),
      makeRow({ author: null }),
    );

    expect([comment.canEdit, comment.canDelete]).toEqual([false, false]);
  });
});
