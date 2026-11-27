import { describe, expect, it } from "vitest";
import {
  codePointLength,
  hasNoLineBreak,
  hasNoNul,
  hasVisibleText,
} from "./text";

const cp = (code: number) => String.fromCodePoint(code);

describe("hasVisibleText", () => {
  it.each([
    "",
    "   ",
    "\n\t",
    `${cp(0x200b)}${cp(0x200d)}`,
    cp(0xfeff),
    cp(0x2800),
    cp(0x3164),
    cp(0xfe0f),
    cp(0xfff9),
    cp(0x1d159),
    cp(0xad),
    cp(0x7),
  ])("should refuse text with nothing visible: %j", (text) => {
    expect(hasVisibleText(text)).toBe(false);
  });

  it.each(["a", ` ${cp(0x200b)}x `, cp(0x1f600), "ã"])(
    "should accept text with a visible character: %j",
    (text) => {
      expect(hasVisibleText(text)).toBe(true);
    },
  );
});

describe("hasNoNul", () => {
  it("should refuse a NUL character anywhere", () => {
    expect(hasNoNul(`ab${cp(0)}c`)).toBe(false);
  });

  it("should accept text without NUL", () => {
    expect(hasNoNul("abc")).toBe(true);
  });
});

describe("hasNoLineBreak", () => {
  it.each(["\n", "\r", "\v", "\f", cp(0x85), cp(0x2028), cp(0x2029)])(
    "should refuse a line break: %j",
    (lineBreak) => {
      expect(hasNoLineBreak(`a${lineBreak}b`)).toBe(false);
    },
  );

  it("should accept tabs and spaces", () => {
    expect(hasNoLineBreak("a\tb c")).toBe(true);
  });
});

describe("codePointLength", () => {
  it("should count an astral character once", () => {
    expect(codePointLength(`a${cp(0x1f600)}b`)).toBe(3);
  });
});
