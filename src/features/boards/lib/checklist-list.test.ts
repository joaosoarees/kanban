import { describe, expect, it } from "vitest";
import {
  countDone,
  moveToIndex,
  placeAfter,
  previousIdOf,
  type ChecklistEntry,
} from "./checklist-list";

function entry(id: string, completed = false): ChecklistEntry {
  return { id, text: `Item ${id}`, completed };
}

const LIST = [entry("a"), entry("b", true), entry("c")];

function idsOf(items: ChecklistEntry[]) {
  return items.map(({ id }) => id);
}

describe("previousIdOf", () => {
  it("should return null for the first item", () => {
    const result = previousIdOf(LIST, "a");

    expect(result).toBe(null);
  });

  it("should return the id of the item before it", () => {
    const result = previousIdOf(LIST, "c");

    expect(result).toBe("b");
  });

  it("should return undefined when the item is not in the list", () => {
    const result = previousIdOf(LIST, "z");

    expect(result).toBe(undefined);
  });
});

describe("placeAfter", () => {
  it("should put the item first when there is no previous id", () => {
    const result = placeAfter(LIST, entry("c"), null);

    expect(idsOf(result)).toEqual(["c", "a", "b"]);
  });

  it("should put the item right after the previous one", () => {
    const result = placeAfter(LIST, entry("a"), "b");

    expect(idsOf(result)).toEqual(["b", "a", "c"]);
  });

  it("should put a missing item back after its previous one", () => {
    const withoutB = LIST.filter(({ id }) => id !== "b");

    const result = placeAfter(withoutB, entry("b", true), "a");

    expect(result).toEqual(LIST);
  });

  it("should put the item last when the previous id is gone", () => {
    const result = placeAfter(LIST, entry("a"), "z");

    expect(idsOf(result)).toEqual(["b", "c", "a"]);
  });
});

describe("moveToIndex", () => {
  it("should move an item down and report its new previous id", () => {
    const result = moveToIndex(LIST, "a", 2);

    expect(result).toEqual({
      items: [LIST[1], LIST[2], LIST[0]],
      previousId: "c",
    });
  });

  it("should move an item to the top with no previous id", () => {
    const result = moveToIndex(LIST, "c", 0);

    expect(result).toEqual({
      items: [LIST[2], LIST[0], LIST[1]],
      previousId: null,
    });
  });

  it("should clamp an index before the start", () => {
    const result = moveToIndex(LIST, "c", -1);

    expect(result).toEqual({
      items: [LIST[2], LIST[0], LIST[1]],
      previousId: null,
    });
  });

  it("should clamp an index past the end", () => {
    const result = moveToIndex(LIST, "a", 9);

    expect(result).toEqual({
      items: [LIST[1], LIST[2], LIST[0]],
      previousId: "c",
    });
  });

  it("should return null when the item is not in the list", () => {
    const result = moveToIndex(LIST, "z", 0);

    expect(result).toBe(null);
  });
});

describe("countDone", () => {
  it("should count the completed items", () => {
    const result = countDone(LIST);

    expect(result).toBe(1);
  });
});
