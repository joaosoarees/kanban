import { describe, expect, it } from "vitest";
import { isResetGrantCurrent } from "@/features/auth/lib/password-reset";

const at = (iso: string) => new Date(`2026-11-25T${iso}Z`);

describe("isResetGrantCurrent", () => {
  it("should accept a grant when the password never changed", () => {
    expect(isResetGrantCurrent(at("12:00:05.000"), null)).toBe(true);
  });

  it("should accept a grant issued after the last change", () => {
    expect(isResetGrantCurrent(at("12:00:05.000"), at("11:00:00.000"))).toBe(
      true,
    );
  });

  it("should refuse a grant once the password changed in its second", () => {
    expect(isResetGrantCurrent(at("12:00:05.000"), at("12:00:05.000"))).toBe(
      false,
    );
    expect(isResetGrantCurrent(at("12:00:05.000"), at("12:00:05.400"))).toBe(
      false,
    );
  });

  it("should refuse a grant once the password changed after it", () => {
    expect(isResetGrantCurrent(at("12:00:05.000"), at("12:03:00.000"))).toBe(
      false,
    );
  });
});
