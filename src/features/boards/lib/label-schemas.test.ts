import { describe, expect, it } from "vitest";
import { labelSchema } from "./label-schemas";

const NUL = String.fromCodePoint(0);
const ZERO_WIDTH = String.fromCodePoint(0x200b);

describe("labelSchema", () => {
  it("trims a valid name", () => {
    const parsed = labelSchema.parse({ name: "  Bug  ", color: "RED" });
    expect(parsed.name).toBe("Bug");
  });

  it("stores a decomposed name in composed form", () => {
    const decomposed = `Cafe${String.fromCodePoint(0x301)}`;
    const composed = `Caf${String.fromCodePoint(0xe9)}`;
    expect(labelSchema.parse({ name: decomposed, color: "RED" }).name).toBe(
      composed,
    );
  });

  it("accepts a name at the length limit", () => {
    const name = "a".repeat(30);
    expect(labelSchema.parse({ name, color: "BLUE" }).name).toBe(name);
  });

  it("refuses a name over the length limit", () => {
    const parsed = labelSchema.safeParse({
      name: "a".repeat(31),
      color: "BLUE",
    });
    expect(parsed.success).toBe(false);
  });

  it.each([
    `${ZERO_WIDTH} ${ZERO_WIDTH}`,
    `a${NUL}b`,
    "a\nb",
    `a${String.fromCodePoint(0x2028)}b`,
  ])("refuses the invalid name %j", (name) => {
    expect(labelSchema.safeParse({ name, color: "GREEN" }).success).toBe(false);
  });

  it("refuses a color outside the palette", () => {
    const parsed = labelSchema.safeParse({ name: "Bug", color: "#ff0000" });
    expect(parsed.success).toBe(false);
  });
});
