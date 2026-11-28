import { describe, expect, it } from "vitest";
import {
  checklistItemSchema,
  moveChecklistItemSchema,
} from "./checklist-schemas";

const ITEM_ID = "01a21e59-e2f6-7657-b816-ce9f42cd41d0";
const OTHER_ID = "01a21e59-e2f8-70a9-8d18-85355a81bff8";
const NUL = String.fromCodePoint(0);

describe("checklistItemSchema", () => {
  it("should trim a valid item", () => {
    const parsed = checklistItemSchema.parse({ text: "  Comprar leite  " });
    expect(parsed.text).toBe("Comprar leite");
  });

  it.each([
    ["blank text", "   "],
    ["a line break", "Comprar\nleite"],
    ["201 characters", "x".repeat(201)],
  ])("should refuse %s", (_case, text) => {
    expect(checklistItemSchema.safeParse({ text }).success).toBe(false);
  });

  it("should refuse a NUL character", () => {
    const parsed = checklistItemSchema.safeParse({ text: `a${NUL}b` });

    expect(parsed.error?.issues.map(({ message }) => message)).toEqual([
      "Remova os caracteres inválidos.",
    ]);
  });

  it("should accept 200 characters", () => {
    const parsed = checklistItemSchema.safeParse({ text: "x".repeat(200) });
    expect(parsed.success).toBe(true);
  });
});

describe("moveChecklistItemSchema", () => {
  it("should accept a move to the top", () => {
    const parsed = moveChecklistItemSchema.safeParse({
      itemId: ITEM_ID,
      previousItemId: null,
    });
    expect(parsed.success).toBe(true);
  });

  it("should refuse an item placed after itself", () => {
    const parsed = moveChecklistItemSchema.safeParse({
      itemId: ITEM_ID,
      previousItemId: ITEM_ID,
    });
    expect(parsed.success).toBe(false);
  });

  it("should accept an item placed after another", () => {
    const parsed = moveChecklistItemSchema.safeParse({
      itemId: ITEM_ID,
      previousItemId: OTHER_ID,
    });
    expect(parsed.success).toBe(true);
  });
});
