import { describe, expect, it } from "vitest";
import {
  afterPasswordFailure,
  isPasswordLocked,
  minutesUntilUnlock,
} from "@/features/auth/lib/password-lock";

const now = new Date("2026-11-26T15:00:00.000Z");
const later = (ms: number) => new Date(now.getTime() + ms);

describe("afterPasswordFailure", () => {
  it("should count a failure while under the limit", () => {
    const guard = { failedPasswordAttempts: 3, passwordLockedUntil: null };

    const next = afterPasswordFailure(guard, now);

    expect(next).toEqual({
      failedPasswordAttempts: 4,
      passwordLockedUntil: null,
    });
  });

  it("should lock for 15 minutes and restart the count on the fifth failure", () => {
    const guard = { failedPasswordAttempts: 4, passwordLockedUntil: null };

    const next = afterPasswordFailure(guard, now);

    expect(next).toEqual({
      failedPasswordAttempts: 0,
      passwordLockedUntil: later(15 * 60_000),
    });
  });

  it("should keep an expired lock out of the new count", () => {
    const guard = { failedPasswordAttempts: 0, passwordLockedUntil: later(-1) };

    const next = afterPasswordFailure(guard, now);

    expect(next).toEqual({
      failedPasswordAttempts: 1,
      passwordLockedUntil: null,
    });
  });
});

describe("isPasswordLocked", () => {
  it.each([
    { title: "no lock", lockedUntil: null, expected: false },
    { title: "a lock ending later", lockedUntil: later(1), expected: true },
    { title: "a lock ending now", lockedUntil: now, expected: false },
  ])("should answer $expected for $title", ({ lockedUntil, expected }) => {
    const guard = {
      failedPasswordAttempts: 0,
      passwordLockedUntil: lockedUntil,
    };

    expect(isPasswordLocked(guard, now)).toBe(expected);
  });
});

describe("minutesUntilUnlock", () => {
  it.each([
    { ms: 15 * 60_000, expected: 15 },
    { ms: 60_001, expected: 2 },
    { ms: 1, expected: 1 },
  ])("should round $ms ms up to $expected minutes", ({ ms, expected }) => {
    const guard = { failedPasswordAttempts: 0, passwordLockedUntil: later(ms) };

    expect(minutesUntilUnlock(guard, now)).toBe(expected);
  });
});
