import { describe, expect, it } from "vitest";
import {
  initialPositions,
  planMove,
  positionAtEnd,
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

describe("initialPositions", () => {
  it("creates strictly increasing positions", () => {
    const [first, second, third] = initialPositions(3);
    expect(first < second).toBe(true);
    expect(second < third).toBe(true);
  });
});

describe("positionAtEnd", () => {
  it("places an item after the last one", () => {
    const ordered = board(["a", "b"]);
    expect(positionAtEnd(ordered) > ordered[1].position).toBe(true);
  });

  it("works on an empty list", () => {
    expect(positionAtEnd([])).toBe(initialPositions(1)[0]);
  });
});

describe("planMove", () => {
  it("moves an item to the start and updates only that item", () => {
    const ordered = board(["a", "b", "c"]);
    const updates = plannedMove(ordered, "c", null);
    expect(updates.map(({ id }) => id)).toEqual(["c"]);
    expect(applyMove(ordered, updates)).toEqual(["c", "a", "b"]);
  });

  it("moves an item between two others", () => {
    const ordered = board(["a", "b", "c"]);
    const updates = plannedMove(ordered, "a", "b");
    expect(applyMove(ordered, updates)).toEqual(["b", "a", "c"]);
  });

  it("moves an item to the end", () => {
    const ordered = board(["a", "b", "c"]);
    const updates = plannedMove(ordered, "a", "c");
    expect(applyMove(ordered, updates)).toEqual(["b", "c", "a"]);
  });

  it("rewrites every position when the neighbors share one", () => {
    const ordered = [
      { id: "a", position: "a0" },
      { id: "b", position: "a0" },
      { id: "c", position: "a1" },
    ];
    const updates = plannedMove(ordered, "c", "a");
    expect(updates).toHaveLength(3);
    expect(applyMove(ordered, updates)).toEqual(["a", "c", "b"]);
  });

  it("returns null when the moved item is gone", () => {
    expect(planMove(board(["a"]), "x", null)).toBeNull();
  });

  it("returns null when the previous item is gone", () => {
    expect(planMove(board(["a", "b"]), "a", "x")).toBeNull();
  });
});
