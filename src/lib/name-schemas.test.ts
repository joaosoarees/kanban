import { describe, expect, it } from "vitest";
import { signUpSchema } from "./auth-schemas";
import { boardNameSchema, columnNameSchema } from "./board-schemas";
import { createWorkspaceSchema } from "./workspace-schemas";

const NUL = String.fromCodePoint(0);

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
});
