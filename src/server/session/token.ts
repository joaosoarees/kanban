import "server-only";
import { jwtVerify, SignJWT } from "jose";

const ALGORITHM = "HS256";
export const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;
export const PENDING_LIFETIME_SECONDS = 60 * 30;
const PENDING_AUDIENCE = "pending-verification";
export const RESET_LIFETIME_SECONDS = 60 * 30;
const RESET_AUDIENCE = "password-reset";
const RESET_GRANT_LIFETIME_SECONDS = 60 * 10;
const RESET_GRANT_AUDIENCE = "password-reset-granted";

const USER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function getKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (secret === undefined || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT()
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_LIFETIME_SECONDS}s`)
    .sign(getKey());
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<{ userId: string; issuedAt: Date } | null> {
  if (token === undefined || token === "") {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: [ALGORITHM],
      requiredClaims: ["sub", "exp", "iat"],
    });
    if (
      payload.aud !== undefined ||
      typeof payload.sub !== "string" ||
      !USER_ID.test(payload.sub) ||
      payload.iat === undefined
    ) {
      return null;
    }
    return { userId: payload.sub, issuedAt: new Date(payload.iat * 1000) };
  } catch {
    return null;
  }
}

export type PendingVerification = { userId: string; registeredAt: Date };
export type PendingToken = PendingVerification & { issuedAt: Date };

export async function createPendingToken({
  userId,
  registeredAt,
}: PendingVerification): Promise<string> {
  return new SignJWT({ reg: registeredAt.getTime() })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setAudience(PENDING_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${PENDING_LIFETIME_SECONDS}s`)
    .sign(getKey());
}

export async function verifyPendingToken(
  token: string | undefined,
): Promise<PendingToken | null> {
  if (token === undefined || token === "") {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: [ALGORITHM],
      audience: PENDING_AUDIENCE,
      requiredClaims: ["sub", "exp", "iat", "aud", "reg"],
    });
    if (
      typeof payload.sub !== "string" ||
      !USER_ID.test(payload.sub) ||
      typeof payload.reg !== "number" ||
      !Number.isSafeInteger(payload.reg) ||
      payload.iat === undefined
    ) {
      return null;
    }
    return {
      userId: payload.sub,
      registeredAt: new Date(payload.reg),
      issuedAt: new Date(payload.iat * 1000),
    };
  } catch {
    return null;
  }
}

export type ResetToken = { email: string; issuedAt: Date };
export type ResetGrant = { userId: string; issuedAt: Date };

export async function createResetToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: ALGORITHM })
    .setAudience(RESET_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${RESET_LIFETIME_SECONDS}s`)
    .sign(getKey());
}

export async function verifyResetToken(
  token: string | undefined,
): Promise<ResetToken | null> {
  if (token === undefined || token === "") {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: [ALGORITHM],
      audience: RESET_AUDIENCE,
      requiredClaims: ["exp", "iat", "aud", "email"],
    });
    if (typeof payload.email !== "string" || payload.iat === undefined) {
      return null;
    }
    return { email: payload.email, issuedAt: new Date(payload.iat * 1000) };
  } catch {
    return null;
  }
}

export async function createResetGrant(userId: string): Promise<string> {
  return new SignJWT()
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setAudience(RESET_GRANT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${RESET_GRANT_LIFETIME_SECONDS}s`)
    .sign(getKey());
}

export async function verifyResetGrant(
  token: string | undefined,
): Promise<ResetGrant | null> {
  if (token === undefined || token === "") {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: [ALGORITHM],
      audience: RESET_GRANT_AUDIENCE,
      requiredClaims: ["sub", "exp", "iat", "aud"],
    });
    if (
      typeof payload.sub !== "string" ||
      !USER_ID.test(payload.sub) ||
      payload.iat === undefined
    ) {
      return null;
    }
    return { userId: payload.sub, issuedAt: new Date(payload.iat * 1000) };
  } catch {
    return null;
  }
}
