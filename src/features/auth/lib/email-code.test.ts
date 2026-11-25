import { describe, expect, it } from "vitest";
import {
  codeExpiresAt,
  isCodeUsable,
  secondsUntilResend,
  verifyCodeSchema,
} from "@/features/auth/lib/email-code";

const sentAt = new Date("2026-11-25T12:00:00.000Z");
const at = (iso: string) => new Date(`2026-11-25T${iso}Z`);

describe("verifyCodeSchema", () => {
  it.each([" 4829 1375 ", "4829\t1375", "4829\u00A01375"])(
    "should accept eight digits pasted with whitespace in %j",
    (code) => {
      expect(verifyCodeSchema.parse({ code })).toEqual({ code: "48291375" });
    },
  );

  it.each(["4829137", "482913751", "4829137a", "４８２９１３７５", ""])(
    "should refuse %j",
    (code) => {
      expect(verifyCodeSchema.safeParse({ code }).success).toBe(false);
    },
  );
});

describe("isCodeUsable", () => {
  const expiresAt = codeExpiresAt(sentAt);

  it("should accept a code until the instant before it expires", () => {
    expect(isCodeUsable({ expiresAt, attempts: 0 }, at("12:14:59.999"))).toBe(
      true,
    );
  });

  it("should refuse a code at the instant it expires", () => {
    expect(isCodeUsable({ expiresAt, attempts: 0 }, at("12:15:00.000"))).toBe(
      false,
    );
  });

  it("should accept the fifth attempt and refuse after five wrong ones", () => {
    const now = at("12:01:00.000");

    expect(isCodeUsable({ expiresAt, attempts: 4 }, now)).toBe(true);
    expect(isCodeUsable({ expiresAt, attempts: 5 }, now)).toBe(false);
  });
});

describe("secondsUntilResend", () => {
  it("should round the wait up to whole seconds", () => {
    expect(secondsUntilResend(sentAt, at("12:00:00.600"))).toBe(60);
    expect(secondsUntilResend(sentAt, at("12:00:59.600"))).toBe(1);
  });

  it("should allow a resend once a minute has passed", () => {
    expect(secondsUntilResend(sentAt, at("12:01:00.000"))).toBe(0);
    expect(secondsUntilResend(sentAt, at("12:05:00.000"))).toBe(0);
  });
});
