import { describe, expect, it } from "vitest";
import {
  inviteMemberSchema,
  inviteTokenSchema,
} from "@/features/members/lib/schemas";

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCd";

describe("inviteTokenSchema", () => {
  it("should accept 43 base64url characters", () => {
    expect(inviteTokenSchema.safeParse(`${TOKEN}e`).success).toBe(true);
  });

  it.each([
    { name: "too short", token: TOKEN },
    { name: "too long", token: `${TOKEN}ef` },
    { name: "with base64 padding", token: `${TOKEN}=` },
    { name: "with a plus sign", token: `${TOKEN}+` },
    { name: "with a slash", token: `${TOKEN}/` },
    { name: "empty", token: "" },
  ])("should reject a token $name", ({ token }) => {
    expect(inviteTokenSchema.safeParse(token).success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("should trim and lower-case the e-mail", () => {
    const parsed = inviteMemberSchema.parse({
      email: " Bruno@Example.COM ",
      role: "MEMBER",
    });

    expect(parsed).toEqual({ email: "bruno@example.com", role: "MEMBER" });
  });

  it("should refuse the owner role", () => {
    const result = inviteMemberSchema.safeParse({
      email: "bruno@example.com",
      role: "OWNER",
    });

    expect(result.success).toBe(false);
  });

  it("should refuse something that is not an e-mail", () => {
    const result = inviteMemberSchema.safeParse({
      email: "bruno",
      role: "ADMIN",
    });

    expect(result.error?.issues.map(({ message }) => message)).toEqual([
      "Digite um e-mail como nome@empresa.com.",
    ]);
  });
});
