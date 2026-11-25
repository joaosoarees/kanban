import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "@/features/auth/schemas";
import { boardNameSchema, columnNameSchema } from "@/features/boards/schemas";
import { createWorkspaceSchema } from "@/features/workspaces/schemas";

const NUL = String.fromCodePoint(0);
const ZERO_WIDTH = String.fromCodePoint(0x200b);
const INVISIBLE_CODE_POINTS = [
  "0001",
  "007F",
  "0085",
  "009F",
  "0600",
  "2800",
  "FFF9",
  "1D159",
  "00AD",
  "034F",
  "061C",
  "115F",
  "17B4",
  "180E",
  "200E",
  "202A",
  "2061",
  "2066",
  "3164",
  "FE0F",
  "FFA0",
  "1D173",
  "E0020",
];

const nameFields = [
  ["board", boardNameSchema.shape.name],
  ["column", columnNameSchema.shape.name],
  ["workspace", createWorkspaceSchema.shape.name],
  ["user", signUpSchema.shape.name],
] as const;

describe.each(nameFields)("%s name", (_label, field) => {
  it("keeps a valid name", () => {
    expect(field.parse("  Produto  ")).toBe("Produto");
  });

  it("refuses a NUL character", () => {
    expect(field.safeParse(`a${NUL}b`).success).toBe(false);
  });

  it("refuses a name with only zero-width characters", () => {
    expect(field.safeParse(`${ZERO_WIDTH} ${ZERO_WIDTH}`).success).toBe(false);
  });

  it.each(INVISIBLE_CODE_POINTS)("refuses only U+%s", (codePoint) => {
    const name = String.fromCodePoint(Number.parseInt(codePoint, 16));
    expect(field.safeParse(name).success).toBe(false);
  });

  it("keeps a zero-width character inside visible text", () => {
    const name = `a${ZERO_WIDTH}b`;
    expect(field.parse(name)).toBe(name);
  });
});

describe("sign-in email", () => {
  it("keeps a valid email", () => {
    expect(signInSchema.shape.email.parse(" Ana@Example.com ")).toBe(
      "ana@example.com",
    );
  });

  it("refuses a NUL character", () => {
    expect(signInSchema.shape.email.safeParse(`a${NUL}b`).success).toBe(false);
  });
});
