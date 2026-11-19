import "server-only";
import { cookies } from "next/headers";
import { SESSION_LIFETIME_SECONDS } from "@/lib/session-token";

export const SESSION_COOKIE = "session";

const sessionCookieOptions = {
  httpOnly: true, // scripts in the page can't read the token
  secure: true, // browsers make an exception for http://localhost
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_LIFETIME_SECONDS, // same lifetime as the token inside
} as const;

// Only from a Server Action or Route Handler, never while a page renders.
export async function writeSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  // Same attributes so the browser matches it; `expires` in the past removes it.
  cookieStore.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    maxAge: undefined,
    expires: new Date(0),
  });
}
