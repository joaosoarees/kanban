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
    expect(previousIdOf(LIST, "a")).toBe(null);
  });

  it("should return the id of the item before it", () => {
    expect(previousIdOf(LIST, "c")).toBe("b");
  });

  it("should return undefined when the item is not in the list", () => {
    expect(previousIdOf(LIST, "z")).toBe(undefined);
  });
});

describe("placeAfter", () => {
  it("should put the item first when there is no previous id", () => {
    const sut = placeAfter(LIST, entry("c"), null);

    expect(idsOf(sut)).toEqual(["c", "a", "b"]);
  });

  it("should put the item right after the previous one", () => {
    const sut = placeAfter(LIST, entry("a"), "b");

    expect(idsOf(sut)).toEqual(["b", "a", "c"]);
  });

  it("should put a missing item back after its previous one", () => {
    const withoutB = LIST.filter(({ id }) => id !== "b");

    const sut = placeAfter(withoutB, entry("b", true), "a");

    expect(sut).toEqual(LIST);
  });

  it("should put the item last when the previous id is gone", () => {
    const sut = placeAfter(LIST, entry("a"), "z");

    expect(idsOf(sut)).toEqual(["b", "c", "a"]);
  });
});

describe("moveToIndex", () => {
  it("should move an item down and report its new previous id", () => {
    const sut = moveToIndex(LIST, "a", 2);

    expect(sut).toEqual({
      items: [LIST[1], LIST[2], LIST[0]],
      previousId: "c",
    });
  });

  it("should move an item to the top with no previous id", () => {
    const sut = moveToIndex(LIST, "c", 0);

    expect(sut).toEqual({
      items: [LIST[2], LIST[0], LIST[1]],
      previousId: null,
    });
  });

  it("should clamp an index past the end", () => {
    const sut = moveToIndex(LIST, "a", 9);

    expect(sut?.previousId).toBe("c");
  });

  it("should return null when the item is not in the list", () => {
    expect(moveToIndex(LIST, "z", 0)).toBe(null);
  });
});

describe("countDone", () => {
  it("should count the completed items", () => {
    expect(countDone(LIST)).toBe(1);
  });
});
