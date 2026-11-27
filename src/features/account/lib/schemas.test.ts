import { describe, expect, it } from "vitest";
import { changePasswordSchema, emailChangeSchema } from "./schemas";

describe("changePasswordSchema", () => {
  it("should accept a new password different from the current one", () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "senha-antiga-123",
      newPassword: "senha-nova-456",
    });

    expect(parsed.success).toBe(true);
  });

  it("should refuse a new password equal to the current one, on the new field", () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "mesma-senha-123",
      newPassword: "mesma-senha-123",
    });

    expect(
      parsed.error?.issues.map(({ path, message }) => ({ path, message })),
    ).toEqual([
      {
        path: ["newPassword"],
        message: "A senha nova precisa ser diferente da atual.",
      },
    ]);
  });

  it("should ask for the current password", () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "senha-nova-456",
    });

    expect(
      parsed.error?.issues.map(({ path, message }) => ({ path, message })),
    ).toEqual([
      { path: ["currentPassword"], message: "Digite sua senha atual." },
    ]);
  });
});

describe("emailChangeSchema", () => {
  it("should trim and lower-case the new e-mail", () => {
    const parsed = emailChangeSchema.parse({
      newEmail: "  Ana@Example.COM ",
      password: "certa-senha-123",
    });

    expect(parsed).toEqual({
      newEmail: "ana@example.com",
      password: "certa-senha-123",
    });
  });

  it("should ask for the current password", () => {
    const parsed = emailChangeSchema.safeParse({
      newEmail: "ana@example.com",
      password: "",
    });

    expect(
      parsed.error?.issues.map(({ path, message }) => ({ path, message })),
    ).toEqual([{ path: ["password"], message: "Digite sua senha atual." }]);
  });
});
