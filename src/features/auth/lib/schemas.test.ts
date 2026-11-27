import { describe, expect, it } from "vitest";
import {
  emailField,
  newPasswordField,
  PASSWORD_MAX_BYTES,
  signInSchema,
  userNameField,
} from "./schemas";

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map(({ message }) => message);

describe("emailField", () => {
  it("should trim and lower-case the e-mail", () => {
    expect(emailField.parse("  Ana@Example.COM ")).toBe("ana@example.com");
  });

  it("should refuse something that is not an e-mail", () => {
    expect(messages(emailField.safeParse("ana"))).toEqual([
      "Digite um e-mail como nome@empresa.com.",
    ]);
  });

  it("should refuse an e-mail over 254 characters", () => {
    const email = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(62)}`;

    expect(messages(emailField.safeParse(email))).toEqual([
      "E-mail longo demais.",
    ]);
  });
});

describe("newPasswordField", () => {
  it("should refuse fewer than 8 characters", () => {
    expect(messages(newPasswordField.safeParse("1234567"))).toEqual([
      "Use pelo menos 8 caracteres.",
    ]);
  });

  it("should accept a password at the byte limit", () => {
    const password = "a".repeat(PASSWORD_MAX_BYTES);

    expect(newPasswordField.safeParse(password).success).toBe(true);
  });

  it("should count bytes, not characters", () => {
    const password = "ã".repeat(PASSWORD_MAX_BYTES / 2 + 1);

    expect(messages(newPasswordField.safeParse(password))).toEqual([
      "Senha longa demais.",
    ]);
  });
});

describe("userNameField", () => {
  it("should trim the name", () => {
    expect(userNameField.parse("  Ana Lima ")).toBe("Ana Lima");
  });

  it("should refuse a name without visible text", () => {
    expect(messages(userNameField.safeParse("   "))).toEqual([
      "Digite seu nome.",
    ]);
  });

  it("should refuse a name over 120 characters", () => {
    expect(messages(userNameField.safeParse("a".repeat(121)))).toEqual([
      "Use no máximo 120 caracteres.",
    ]);
  });
});

describe("signInSchema", () => {
  it("should keep the password as typed", () => {
    const parsed = signInSchema.parse({
      email: " Ana@Example.com ",
      password: "  senha com espaço ",
    });

    expect(parsed).toEqual({
      email: "ana@example.com",
      password: "  senha com espaço ",
    });
  });

  it("should ask for both fields", () => {
    const result = signInSchema.safeParse({ email: " ", password: "" });

    expect(messages(result)).toEqual([
      "Digite seu e-mail.",
      "Digite sua senha.",
    ]);
  });
});
