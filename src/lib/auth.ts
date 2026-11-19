import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { verifySessionToken } from "@/lib/session-token";

// What the app may know about the signed-in user. Never the password hash.
export type SessionUser = { id: string; name: string; email: string };

// The one question every page, layout and action asks. `cache` shares one
// verification and one query per render.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value,
  );
  if (!session) return null;

  // null when the user was deleted after the token was issued. A database
  // failure is not caught: an outage is not "signed out".
  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}
