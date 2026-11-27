import { describe, expect, it } from "vitest";
import { locateCard, moveCardTo, previousCardIdOf } from "./card-moves";

const card = (id: string) => ({ id });
const board = () => [
  { id: "todo", cards: [card("a"), card("b"), card("c")] },
  { id: "doing", cards: [card("d")] },
  { id: "done", cards: [] },
];
const idsIn = (columns: ReturnType<typeof board> | null, columnId: string) =>
  columns?.find(({ id }) => id === columnId)?.cards.map(({ id }) => id);

describe("locateCard", () => {
  it("should find the column and index of a card", () => {
    const location = locateCard(board(), "d");
    expect([location?.column.id, location?.index]).toEqual(["doing", 0]);
  });

  it("should return null for a missing card", () => {
    expect(locateCard(board(), "missing")).toBeNull();
  });
});

describe("moveCardTo", () => {
  it("should move a card down inside its column", () => {
    const moved = moveCardTo(board(), "a", "todo", 2);
    expect(idsIn(moved, "todo")).toEqual(["b", "c", "a"]);
  });

  it("should move a card up inside its column", () => {
    const moved = moveCardTo(board(), "c", "todo", 0);
    expect(idsIn(moved, "todo")).toEqual(["c", "a", "b"]);
  });

  it("should insert a card in another column at the index", () => {
    const moved = moveCardTo(board(), "b", "doing", 0);
    expect(idsIn(moved, "doing")).toEqual(["b", "d"]);
    expect(idsIn(moved, "todo")).toEqual(["a", "c"]);
  });

  it("should move a card into an empty column", () => {
    const moved = moveCardTo(board(), "a", "done", 0);
    expect(idsIn(moved, "done")).toEqual(["a"]);
  });

  it("should clamp an index past the end", () => {
    const moved = moveCardTo(board(), "a", "doing", 99);
    expect(idsIn(moved, "doing")).toEqual(["d", "a"]);
  });

  it("should return null when the card stays in place", () => {
    expect(moveCardTo(board(), "b", "todo", 1)).toBeNull();
  });

  it("should return null when the last card is sent past the end", () => {
    expect(moveCardTo(board(), "c", "todo", 99)).toBeNull();
  });

  it("should return null for a missing card or column", () => {
    expect(moveCardTo(board(), "missing", "todo", 0)).toBeNull();
    expect(moveCardTo(board(), "a", "missing", 0)).toBeNull();
  });
});

describe("previousCardIdOf", () => {
  it("should return the card right before", () => {
    expect(previousCardIdOf(board(), "c")).toBe("b");
  });

  it("should return null for the first card", () => {
    expect(previousCardIdOf(board(), "a")).toBeNull();
  });
});
