import "server-only";
import { cookies } from "next/headers";
import {
  PENDING_LIFETIME_SECONDS,
  RESET_LIFETIME_SECONDS,
  SESSION_LIFETIME_SECONDS,
} from "@/server/session/token";

export const SESSION_COOKIE = "session";
export const PENDING_COOKIE = "pending_verification";
export const RESET_COOKIE = "password_reset";

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

const pendingCookieOptions = {
  ...sessionCookieOptions,
  maxAge: PENDING_LIFETIME_SECONDS,
} as const;

export async function writePendingCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_COOKIE, token, pendingCookieOptions);
}

export async function deletePendingCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_COOKIE, "", {
    ...pendingCookieOptions,
    maxAge: undefined,
    expires: new Date(0),
  });
}

const resetCookieOptions = {
  ...sessionCookieOptions,
  maxAge: RESET_LIFETIME_SECONDS,
} as const;

export async function writeResetCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(RESET_COOKIE, token, resetCookieOptions);
}

export async function deleteResetCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(RESET_COOKIE, "", {
    ...resetCookieOptions,
    maxAge: undefined,
    expires: new Date(0),
  });
}
