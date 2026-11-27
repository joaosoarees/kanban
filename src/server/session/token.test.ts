import { SignJWT } from "jose";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  setSystemTime,
} from "vitest";
import {
  createInviteToken,
  createPendingToken,
  createResetGrant,
  createResetToken,
  createSessionToken,
  PENDING_LIFETIME_SECONDS,
  RESET_LIFETIME_SECONDS,
  SESSION_LIFETIME_SECONDS,
  verifyInviteToken,
  verifyPendingToken,
  verifyResetGrant,
  verifyResetToken,
  verifySessionToken,
} from "./token";

const SECRET = "test-secret-with-at-least-32-characters";
const USER_ID = "01a21aa6-00c7-757d-b580-a39da5d7b963";
const NOW = new Date("2026-11-26T12:00:00.000Z");

async function signWith(claims: Record<string, unknown>, secret = SECRET) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
}

function advanceSeconds(seconds: number) {
  setSystemTime(new Date(NOW.getTime() + seconds * 1000));
}

const originalSecret = process.env.SESSION_SECRET;

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
  setSystemTime(NOW);
});

afterEach(() => {
  setSystemTime();
  if (originalSecret === undefined) {
    delete process.env.SESSION_SECRET;
  } else {
    process.env.SESSION_SECRET = originalSecret;
  }
});

describe("session token", () => {
  it("should carry the user and the password change time", async () => {
    const passwordChangedAt = new Date("2026-11-20T08:00:00.000Z");
    const token = await createSessionToken({
      userId: USER_ID,
      passwordChangedAt,
    });

    const session = await verifySessionToken(token);

    expect(session).toEqual({
      userId: USER_ID,
      passwordChangedAt: passwordChangedAt.getTime(),
    });
  });

  it("should carry a null password change time", async () => {
    const token = await createSessionToken({
      userId: USER_ID,
      passwordChangedAt: null,
    });

    const session = await verifySessionToken(token);

    expect(session).toEqual({ userId: USER_ID, passwordChangedAt: null });
  });

  it("should expire after its lifetime", async () => {
    const token = await createSessionToken({
      userId: USER_ID,
      passwordChangedAt: null,
    });
    advanceSeconds(SESSION_LIFETIME_SECONDS + 1);

    expect(await verifySessionToken(token)).toBe(null);
  });

  it.each([undefined, ""])(
    "should refuse a missing token: %j",
    async (token) => {
      expect(await verifySessionToken(token)).toBe(null);
    },
  );

  it("should refuse a token signed with another secret", async () => {
    const token = await signWith(
      { sub: USER_ID, pwc: null },
      "another-secret-with-at-least-32-chars",
    );

    expect(await verifySessionToken(token)).toBe(null);
  });

  it("should refuse a token that has an audience", async () => {
    const token = await createPendingToken({
      userId: USER_ID,
      registeredAt: NOW,
    });

    expect(await verifySessionToken(token)).toBe(null);
  });

  it("should refuse a subject that is not a user id", async () => {
    const token = await signWith({ sub: "admin", pwc: null });

    expect(await verifySessionToken(token)).toBe(null);
  });

  it("should refuse a password change time that is not a number", async () => {
    const token = await signWith({ sub: USER_ID, pwc: "2026-11-20" });

    expect(await verifySessionToken(token)).toBe(null);
  });

  it("should refuse to sign without a long enough secret", async () => {
    process.env.SESSION_SECRET = "short";

    const error = await createSessionToken({
      userId: USER_ID,
      passwordChangedAt: null,
    }).catch((reason: unknown) => reason);

    expect(error).toEqual(
      new Error("SESSION_SECRET must be set to at least 32 characters."),
    );
  });
});

describe("pending verification token", () => {
  it("should refuse the right claims under another audience", async () => {
    const token = await signWith({
      sub: USER_ID,
      aud: "password-reset",
      reg: NOW.getTime(),
    });

    expect(await verifyPendingToken(token)).toBe(null);
  });

  it("should carry the user, the sign-up time and the issue time", async () => {
    const registeredAt = new Date("2026-11-26T11:50:00.000Z");
    const token = await createPendingToken({ userId: USER_ID, registeredAt });

    const pending = await verifyPendingToken(token);

    expect(pending).toEqual({ userId: USER_ID, registeredAt, issuedAt: NOW });
  });

  it("should expire after its lifetime", async () => {
    const token = await createPendingToken({
      userId: USER_ID,
      registeredAt: NOW,
    });
    advanceSeconds(PENDING_LIFETIME_SECONDS + 1);

    expect(await verifyPendingToken(token)).toBe(null);
  });

  it("should refuse a session token", async () => {
    const token = await createSessionToken({
      userId: USER_ID,
      passwordChangedAt: null,
    });

    expect(await verifyPendingToken(token)).toBe(null);
  });

  it("should refuse a sign-up time that is not a whole number", async () => {
    const token = await signWith({
      sub: USER_ID,
      aud: "pending-verification",
      reg: 1.5,
    });

    expect(await verifyPendingToken(token)).toBe(null);
  });
});

describe("password reset token", () => {
  it("should refuse the right claims under another audience", async () => {
    const token = await signWith({
      aud: "password-reset-granted",
      email: "ana@example.com",
    });

    expect(await verifyResetToken(token)).toBe(null);
  });

  it("should carry the e-mail and the issue time", async () => {
    const token = await createResetToken("ana@example.com");

    const reset = await verifyResetToken(token);

    expect(reset).toEqual({ email: "ana@example.com", issuedAt: NOW });
  });

  it("should expire after its lifetime", async () => {
    const token = await createResetToken("ana@example.com");
    advanceSeconds(RESET_LIFETIME_SECONDS + 1);

    expect(await verifyResetToken(token)).toBe(null);
  });

  it("should refuse a reset grant", async () => {
    const token = await createResetGrant(USER_ID);

    expect(await verifyResetToken(token)).toBe(null);
  });
});

describe("password reset grant", () => {
  it("should refuse the right claims under another audience", async () => {
    const token = await signWith({ sub: USER_ID, aud: "password-reset" });

    expect(await verifyResetGrant(token)).toBe(null);
  });

  it("should carry the user and the issue time", async () => {
    const token = await createResetGrant(USER_ID);

    const grant = await verifyResetGrant(token);

    expect(grant).toEqual({ userId: USER_ID, issuedAt: NOW });
  });

  it("should expire after ten minutes", async () => {
    const token = await createResetGrant(USER_ID);
    advanceSeconds(10 * 60 + 1);

    expect(await verifyResetGrant(token)).toBe(null);
  });

  it("should refuse a reset token", async () => {
    const token = await createResetToken("ana@example.com");

    expect(await verifyResetGrant(token)).toBe(null);
  });
});

describe("invite token", () => {
  it("should refuse the right claims under another audience", async () => {
    const token = await signWith({
      aud: "password-reset",
      inv: "invite-secret",
    });

    expect(await verifyInviteToken(token)).toBe(null);
  });

  it("should carry the invite until it expires", async () => {
    const expiresAt = new Date(NOW.getTime() + 60_000);
    const token = await createInviteToken("invite-secret", expiresAt);

    expect(await verifyInviteToken(token)).toBe("invite-secret");
  });

  it("should refuse it from its expiry on", async () => {
    const expiresAt = new Date(NOW.getTime() + 60_000);
    const token = await createInviteToken("invite-secret", expiresAt);
    advanceSeconds(61);

    expect(await verifyInviteToken(token)).toBe(null);
  });

  it("should refuse a reset token", async () => {
    const token = await createResetToken("ana@example.com");

    expect(await verifyInviteToken(token)).toBe(null);
  });

  it("should refuse an invite claim that is not a string", async () => {
    const token = await signWith({ aud: "pending-invite", inv: 42 });

    expect(await verifyInviteToken(token)).toBe(null);
  });
});
