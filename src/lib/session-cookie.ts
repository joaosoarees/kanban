import "server-only";
import { cookies } from "next/headers";
import { SESSION_LIFETIME_SECONDS } from "@/lib/session-token";

export const SESSION_COOKIE = "session";

const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_LIFETIME_SECONDS,
} as const;

export async function writeSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    maxAge: undefined,
    expires: new Date(0),
  });
}
