import { describe, expect, it } from "vitest";
import { isSessionCurrent } from "@/server/session/revocation";

const at = (iso: string) => new Date(`2026-11-25T${iso}Z`);

describe("isSessionCurrent", () => {
  it("should accept any session when the password never changed", () => {
    expect(isSessionCurrent(at("08:00:00.000"), null)).toBe(true);
  });

  it("should refuse a session issued before the password changed", () => {
    expect(isSessionCurrent(at("12:00:04.000"), at("12:00:05.200"))).toBe(
      false,
    );
  });

  it("should accept the session issued in the second of the change", () => {
    expect(isSessionCurrent(at("12:00:05.000"), at("12:00:05.900"))).toBe(true);
  });

  it("should accept a session issued after the change", () => {
    expect(isSessionCurrent(at("12:00:06.000"), at("12:00:05.200"))).toBe(true);
  });
});
