import { describe, expect, it } from "vitest";
import { inviteTokenSchema } from "@/features/members/lib/schemas";

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
