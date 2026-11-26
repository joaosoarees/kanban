import { describe, expect, it } from "vitest";
import { newestFirst, withPage } from "@/features/boards/lib/comment-list";
import type { CardComment } from "@/features/boards/server/comment-queries";

function comment(id: string, body = `Comentário ${id}`): CardComment {
  return {
    id,
    body,
    createdAt: "2026-11-26T12:00:00.000Z",
    editedAt: null,
    author: { id: "ana", name: "Ana" },
    canEdit: true,
    canDelete: true,
  };
}

function ids(comments: CardComment[]) {
  return comments.map(({ id }) => id);
}

describe("newestFirst", () => {
  it("should sort by id from newest to oldest", () => {
    const sorted = newestFirst([
      comment("01a"),
      comment("01c"),
      comment("01b"),
    ]);

    expect(ids(sorted)).toEqual(["01c", "01b", "01a"]);
  });

  it("should keep one copy of a repeated id, the last one given", () => {
    const sorted = newestFirst([
      comment("01a", "antes"),
      comment("01a", "depois"),
    ]);

    expect(sorted).toEqual([comment("01a", "depois")]);
  });
});

describe("withPage", () => {
  it("should merge a page into the list without repeating known comments", () => {
    const current = [comment("01c"), comment("01b")];

    const merged = withPage(
      current,
      [comment("01b"), comment("01a")],
      new Set(),
    );

    expect(ids(merged)).toEqual(["01c", "01b", "01a"]);
  });

  it("should keep the known version when the page repeats a comment", () => {
    const current = [comment("01b", "editado aqui")];

    const merged = withPage(
      current,
      [comment("01b", "versão do servidor")],
      new Set(),
    );

    expect(merged).toEqual([comment("01b", "editado aqui")]);
  });

  it("should leave out comments removed while the page was loading", () => {
    const merged = withPage(
      [],
      [comment("01b"), comment("01a")],
      new Set(["01b"]),
    );

    expect(ids(merged)).toEqual(["01a"]);
  });
});
