import { jwtVerify, SignJWT } from "jose";

const ALGORITHM = "HS256";
export const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7; // 7 days

// users.id is a uuid: a `sub` of any other shape names no user (and would make
// the query throw instead of finding nobody).
const USER_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string): Promise<string> {
  return (
    new SignJWT()
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(userId)
      .setIssuedAt()
      // A number here would be a Unix timestamp, not a duration: keep the "s".
      .setExpirationTime(`${SESSION_LIFETIME_SECONDS}s`)
      .sign(getKey())
  );
}

// Never throws: missing, malformed, tampered, expired or foreign tokens are null.
export async function verifySessionToken(
  token: string | undefined,
): Promise<{ userId: string } | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: [ALGORITHM],
      requiredClaims: ["sub", "exp"],
    });
    if (typeof payload.sub !== "string" || !USER_ID.test(payload.sub)) {
      return null;
    }
    return { userId: payload.sub };
  } catch {
    return null;
  }
}
