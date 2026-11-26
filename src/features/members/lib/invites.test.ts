import { describe, expect, it } from "vitest";
import {
  inviteDueLabel,
  isInviteExpired,
  secondsUntilInviteResend,
  sendWindowStart,
} from "@/features/members/lib/invites";

const now = new Date("2026-11-26T15:00:00.000Z");

describe("inviteDueLabel", () => {
  it("should count whole days in São Paulo time", () => {
    expect(inviteDueLabel(new Date("2026-12-02T14:00:00.000Z"), now)).toBe(
      "Vence em 6 dias",
    );
  });

  it("should say today when it ends later on the same São Paulo day", () => {
    expect(inviteDueLabel(new Date("2026-11-27T02:59:00.000Z"), now)).toBe(
      "Vence hoje",
    );
  });

  it("should say tomorrow once the end crosses São Paulo midnight", () => {
    expect(inviteDueLabel(new Date("2026-11-27T03:00:00.000Z"), now)).toBe(
      "Vence amanhã",
    );
  });

  it("should give the São Paulo date of an expired invite", () => {
    expect(inviteDueLabel(new Date("2026-11-20T01:00:00.000Z"), now)).toBe(
      "Venceu em 19/11",
    );
  });

  it("should treat the exact end as expired", () => {
    expect(inviteDueLabel(now, now)).toBe("Venceu em 26/11");
  });
});

describe("isInviteExpired", () => {
  it("should keep an invite valid until its last millisecond", () => {
    const expiresAt = new Date(now.getTime() + 1);

    expect(isInviteExpired(expiresAt, now)).toBe(false);
  });

  it("should expire an invite at the exact end", () => {
    expect(isInviteExpired(now, now)).toBe(true);
  });
});

describe("sendWindowStart", () => {
  it("should start the daily send window 24 hours before now", () => {
    expect(sendWindowStart(now)).toEqual(new Date("2026-11-25T15:00:00.000Z"));
  });
});

describe("secondsUntilInviteResend", () => {
  it.each([
    { sentMsAgo: 0, expected: 60 },
    { sentMsAgo: 1, expected: 60 },
    { sentMsAgo: 59_001, expected: 1 },
    { sentMsAgo: 60_000, expected: 0 },
    { sentMsAgo: 3_600_000, expected: 0 },
  ])(
    "should wait $expected seconds when sent $sentMsAgo ms ago",
    ({ sentMsAgo, expected }) => {
      const sentAt = new Date(now.getTime() - sentMsAgo);

      expect(secondsUntilInviteResend(sentAt, now)).toBe(expected);
    },
  );
});
