import { describe, expect, it } from "vitest";
import {
  codeExpiresAt,
  isCodeUsable,
  windowAfterWrongAttempt,
  secondsUntilAttemptsReset,
  secondsUntilResend,
  verifyCodeSchema,
} from "@/features/auth/lib/email-code";

const sentAt = new Date("2026-11-25T12:00:00.000Z");
const at = (iso: string) => new Date(`2026-11-25T${iso}Z`);

describe("verifyCodeSchema", () => {
  it.each([" 482 913 ", "482\t913", "482\u00A0913"])(
    "should accept six digits pasted with whitespace in %j",
    (code) => {
      expect(verifyCodeSchema.parse({ code })).toEqual({ code: "482913" });
    },
  );

  it.each(["48291", "4829134", "48291a", "４８２９１３", ""])(
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

describe("attempt window", () => {
  const window = { windowStartedAt: sentAt, windowAttempts: 7 };

  it("should open a window with the first wrong attempt", () => {
    expect(
      windowAfterWrongAttempt(
        { windowStartedAt: null, windowAttempts: 0 },
        sentAt,
      ),
    ).toEqual({ windowStartedAt: sentAt, windowAttempts: 1 });
  });

  it("should count a wrong attempt within the hour", () => {
    expect(windowAfterWrongAttempt(window, at("12:59:59.999"))).toEqual({
      windowStartedAt: sentAt,
      windowAttempts: 8,
    });
  });

  it("should start a new window with a wrong attempt after the hour", () => {
    expect(windowAfterWrongAttempt(window, at("13:00:00.000"))).toEqual({
      windowStartedAt: at("13:00:00.000"),
      windowAttempts: 1,
    });
  });

  it("should return only the window fields from a stored row", () => {
    const stored = { ...window, attempts: 3, codeHash: "x" };

    expect(windowAfterWrongAttempt(stored, at("12:30:00.000"))).toEqual({
      windowStartedAt: sentAt,
      windowAttempts: 8,
    });
  });

  it("should not block an account that never got a code wrong", () => {
    expect(
      secondsUntilAttemptsReset(
        { windowStartedAt: null, windowAttempts: 0 },
        sentAt,
      ),
    ).toBe(0);
  });

  it("should not block before the tenth wrong attempt", () => {
    expect(
      secondsUntilAttemptsReset(
        { windowStartedAt: sentAt, windowAttempts: 9 },
        at("12:10:00.000"),
      ),
    ).toBe(0);
  });

  it("should block after ten wrong attempts until the hour is over", () => {
    const full = { windowStartedAt: sentAt, windowAttempts: 10 };

    expect(secondsUntilAttemptsReset(full, at("12:10:00.600"))).toBe(3000);
    expect(secondsUntilAttemptsReset(full, at("12:59:59.999"))).toBe(1);
    expect(secondsUntilAttemptsReset(full, at("13:00:00.000"))).toBe(0);
  });
});
