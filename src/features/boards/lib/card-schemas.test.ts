import { describe, expect, it } from "vitest";
import {
  cardDescriptionSchema,
  cardDueSchema,
  cardTitleSchema,
} from "./card-schemas";

const NUL = String.fromCodePoint(0);
const ZERO_WIDTH = String.fromCodePoint(0x200b);
const HANGUL_FILLER = String.fromCodePoint(0x3164);
const LEFT_TO_RIGHT_MARK = String.fromCodePoint(0x200e);
const TAG_SPACE = String.fromCodePoint(0xe0020);
const INVISIBLE = `${HANGUL_FILLER}${LEFT_TO_RIGHT_MARK}${TAG_SPACE}`;
const UNPRINTABLE = String.fromCodePoint(0x01, 0x85, 0x2800, 0xfff9, 0x1d159);

describe("cardTitleSchema", () => {
  it("trims a valid title", () => {
    const parsed = cardTitleSchema.parse({ title: "  Revisar PR  " });
    expect(parsed.title).toBe("Revisar PR");
  });

  it("refuses a NUL character", () => {
    const parsed = cardTitleSchema.safeParse({ title: `a${NUL}b` });
    expect(parsed.success).toBe(false);
  });

  it("refuses a title with only zero-width characters", () => {
    const parsed = cardTitleSchema.safeParse({
      title: `${ZERO_WIDTH} ${ZERO_WIDTH}`,
    });
    expect(parsed.success).toBe(false);
  });

  it("refuses a title with only default-ignorable characters", () => {
    expect(cardTitleSchema.safeParse({ title: INVISIBLE }).success).toBe(false);
  });

  it("refuses a title with only control characters and blank glyphs", () => {
    expect(cardTitleSchema.safeParse({ title: UNPRINTABLE }).success).toBe(
      false,
    );
  });

  it.each([0x0b, 0x0c, 0x85])(
    "refuses line break code point %i",
    (codePoint) => {
      const title = `a${String.fromCodePoint(codePoint)}b`;
      expect(cardTitleSchema.safeParse({ title }).success).toBe(false);
    },
  );

  it("keeps a zero-width character inside visible text", () => {
    const title = `a${ZERO_WIDTH}b`;
    expect(cardTitleSchema.parse({ title }).title).toBe(title);
  });
});

describe("cardDescriptionSchema", () => {
  it("keeps line breaks inside the text", () => {
    const description = "linha 1\nlinha 2";
    expect(cardDescriptionSchema.parse({ description }).description).toBe(
      description,
    );
  });

  it("stores an empty description as null", () => {
    const parsed = cardDescriptionSchema.parse({ description: "   " });
    expect(parsed.description).toBeNull();
  });

  it("stores a zero-width description as null", () => {
    const parsed = cardDescriptionSchema.parse({
      description: `${ZERO_WIDTH} ${ZERO_WIDTH}`,
    });
    expect(parsed.description).toBeNull();
  });

  it("stores a default-ignorable description as null", () => {
    const parsed = cardDescriptionSchema.parse({ description: INVISIBLE });
    expect(parsed.description).toBeNull();
  });

  it("stores a description of control characters and blank glyphs as null", () => {
    const parsed = cardDescriptionSchema.parse({ description: UNPRINTABLE });
    expect(parsed.description).toBeNull();
  });

  it("accepts its own empty output when parsed again", () => {
    const first = cardDescriptionSchema.parse({ description: "" });
    const second = cardDescriptionSchema.safeParse(first);
    expect(second.success).toBe(true);
    expect(second.data?.description).toBeNull();
  });

  it("refuses a NUL character", () => {
    const parsed = cardDescriptionSchema.safeParse({
      description: `a${NUL}b`,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("cardDueSchema", () => {
  it("takes a calendar day or null", () => {
    expect(cardDueSchema.safeParse({ dueOn: "2026-11-12" }).success).toBe(true);
    expect(cardDueSchema.safeParse({ dueOn: null }).success).toBe(true);
  });

  it("refuses a time, an impossible day and a missing key", () => {
    expect(
      cardDueSchema.safeParse({ dueOn: "2026-11-12T10:00:00Z" }).success,
    ).toBe(false);
    expect(cardDueSchema.safeParse({ dueOn: "2026-02-30" }).success).toBe(
      false,
    );
    expect(cardDueSchema.safeParse({}).success).toBe(false);
  });
});
