import { describe, expect, it } from "vitest";
import {
  COMMENT_MAX_LENGTH,
  commentPageSchema,
  commentSchema,
} from "./comment-schemas";

const NUL = String.fromCodePoint(0);
const ZERO_WIDTH = String.fromCodePoint(0x200b);
const EMOJI = String.fromCodePoint(0x1f600);

describe("commentSchema", () => {
  it("should trim the body", () => {
    const parsed = commentSchema.parse({ body: "  Revisar o PR \n" });

    expect(parsed).toEqual({ body: "Revisar o PR" });
  });

  it("should keep line breaks inside the body", () => {
    const parsed = commentSchema.parse({ body: "Primeira linha\nSegunda" });

    expect(parsed.body).toBe("Primeira linha\nSegunda");
  });

  it.each(["", "   ", `${ZERO_WIDTH} ${ZERO_WIDTH}`, "\n\t"])(
    "should refuse a body without visible text: %j",
    (body) => {
      const parsed = commentSchema.safeParse({ body });

      expect(parsed.error?.issues.map(({ message }) => message)).toEqual([
        "Escreva o comentário.",
      ]);
    },
  );

  it("should accept a body at the length limit counted in code points", () => {
    const parsed = commentSchema.safeParse({
      body: EMOJI.repeat(COMMENT_MAX_LENGTH),
    });

    expect(parsed.success).toBe(true);
  });

  it("should refuse a body over the length limit", () => {
    const parsed = commentSchema.safeParse({
      body: "a".repeat(COMMENT_MAX_LENGTH + 1),
    });

    expect(parsed.error?.issues.map(({ message }) => message)).toEqual([
      "Até 5.000 caracteres.",
    ]);
  });

  it("should refuse a NUL character", () => {
    const parsed = commentSchema.safeParse({ body: `a${NUL}b` });

    expect(parsed.error?.issues.map(({ message }) => message)).toEqual([
      "Remova os caracteres inválidos.",
    ]);
  });
});

describe("commentPageSchema", () => {
  it("should accept a null cursor", () => {
    expect(commentPageSchema.safeParse({ before: null }).success).toBe(true);
  });

  it("should accept a UUID cursor", () => {
    const parsed = commentPageSchema.safeParse({
      before: "01a21aa6-00c7-757d-b580-a39da5d7b963",
    });

    expect(parsed.success).toBe(true);
  });

  it("should refuse a cursor that is not a UUID", () => {
    const parsed = commentPageSchema.safeParse({ before: "comment-1" });

    expect(parsed.success).toBe(false);
  });
});
