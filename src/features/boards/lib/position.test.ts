import { describe, expect, it } from "vitest";
import {
  initialPositions,
  planMove,
  positionAtEnd,
  positionInColumn,
  type Positioned,
} from "./position";

function board(ids: string[]): Positioned[] {
  const positions = initialPositions(ids.length);
  return ids.map((id, index) => ({ id, position: positions[index] }));
}

function plannedMove(
  ordered: Positioned[],
  movedId: string,
  previousId: string | null,
) {
  const updates = planMove(ordered, movedId, previousId);
  if (!updates) {
    throw new Error("expected a planned move");
  }
  return updates;
}

function applyMove(ordered: Positioned[], updates: Positioned[]) {
  const changed = new Map(updates.map(({ id, position }) => [id, position]));
  return ordered
    .map(({ id, position }) => ({
      id,
      position: changed.get(id) ?? position,
    }))
    .toSorted((a, b) => (a.position < b.position ? -1 : 1))
    .map(({ id }) => id);
}

function plannedPosition(
  ordered: Positioned[],
  movedId: string,
  previousId: string | null,
) {
  const position = positionInColumn(ordered, movedId, previousId);
  if (position === null) {
    throw new Error("expected a planned position");
  }
  return position;
}

describe("positionInColumn", () => {
  const [a, b, c] = board(["a", "b", "c"]);

  it("should create a position in an empty column", () => {
    expect(positionInColumn([], "moved", null)).toBe(initialPositions(1)[0]);
  });

  it("should place the card before the first one", () => {
    const position = plannedPosition([a, b, c], "moved", null);
    expect(position < a.position).toBe(true);
  });

  it("should place the card between two others", () => {
    const position = plannedPosition([a, b, c], "moved", "a");
    expect(a.position < position).toBe(true);
    expect(position < b.position).toBe(true);
  });

  it("should place the card after the last one", () => {
    const position = plannedPosition([a, b, c], "moved", "c");
    expect(c.position < position).toBe(true);
  });

  it("should ignore the card's own position when moving inside the column", () => {
    const position = plannedPosition([a, b, c], "b", "c");
    expect(c.position < position).toBe(true);
  });

  it("should move a card to the top of its own column", () => {
    const position = plannedPosition([a, b, c], "c", null);
    expect(position < a.position).toBe(true);
  });

  it("should refuse a previous card that is not in the column", () => {
    expect(positionInColumn([a, b, c], "moved", "missing")).toBeNull();
  });

  it("should refuse the card as its own previous card", () => {
    expect(positionInColumn([a, b, c], "b", "b")).toBeNull();
  });
});

describe("initialPositions", () => {
  it("should create strictly increasing positions", () => {
    const [first, second, third] = initialPositions(3);
    expect(first < second).toBe(true);
    expect(second < third).toBe(true);
  });
});

describe("positionAtEnd", () => {
  it("should place an item after the last one", () => {
    const ordered = board(["a", "b"]);
    expect(positionAtEnd(ordered) > ordered[1].position).toBe(true);
  });

  it("should work on an empty list", () => {
    expect(positionAtEnd([])).toBe(initialPositions(1)[0]);
  });
});

describe("planMove", () => {
  it("should move an item to the start and update only that item", () => {
    const ordered = board(["a", "b", "c"]);
    const updates = plannedMove(ordered, "c", null);
    expect(updates.map(({ id }) => id)).toEqual(["c"]);
    expect(applyMove(ordered, updates)).toEqual(["c", "a", "b"]);
  });

  it("should move an item between two others", () => {
    const ordered = board(["a", "b", "c"]);
    const updates = plannedMove(ordered, "a", "b");
    expect(applyMove(ordered, updates)).toEqual(["b", "a", "c"]);
  });

  it("should move an item to the end", () => {
    const ordered = board(["a", "b", "c"]);
    const updates = plannedMove(ordered, "a", "c");
    expect(applyMove(ordered, updates)).toEqual(["b", "c", "a"]);
  });

  it("should rewrite every position when the neighbors share one", () => {
    const ordered = [
      { id: "a", position: "a0" },
      { id: "b", position: "a0" },
      { id: "c", position: "a1" },
    ];
    const updates = plannedMove(ordered, "c", "a");
    expect(updates).toHaveLength(3);
    expect(applyMove(ordered, updates)).toEqual(["a", "c", "b"]);
  });

  it("should return null when the moved item is gone", () => {
    expect(planMove(board(["a"]), "x", null)).toBeNull();
  });

  it("should return null when the previous item is gone", () => {
    expect(planMove(board(["a", "b"]), "a", "x")).toBeNull();
  });
});
