import "server-only";
import { jwtVerify, SignJWT } from "jose";

const ALGORITHM = "HS256";
export const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;
export const PENDING_LIFETIME_SECONDS = 60 * 30;
const PENDING_AUDIENCE = "pending-verification";

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
): Promise<{ userId: string } | null> {
  if (token === undefined || token === "") {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: [ALGORITHM],
      requiredClaims: ["sub", "exp"],
    });
    if (
      payload.aud !== undefined ||
      typeof payload.sub !== "string" ||
      !USER_ID.test(payload.sub)
    ) {
      return null;
    }
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export async function createPendingToken(userId: string): Promise<string> {
  return new SignJWT()
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setAudience(PENDING_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${PENDING_LIFETIME_SECONDS}s`)
    .sign(getKey());
}

export async function verifyPendingToken(
  token: string | undefined,
): Promise<{ userId: string } | null> {
  if (token === undefined || token === "") {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: [ALGORITHM],
      audience: PENDING_AUDIENCE,
      requiredClaims: ["sub", "exp", "aud"],
    });
    if (typeof payload.sub !== "string" || !USER_ID.test(payload.sub)) {
      return null;
    }
    return { userId: payload.sub };
  } catch {
    return null;
  }
}
