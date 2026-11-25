import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/server/db";
import { SESSION_COOKIE } from "@/server/session/cookie";
import { isSessionCurrent } from "@/server/session/revocation";
import { verifySessionToken } from "@/server/session/token";

export type SessionUser = { id: string; name: string; email: string };

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value,
  );
  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, passwordChangedAt: true },
  });
  if (!user || !isSessionCurrent(session.issuedAt, user.passwordChangedAt)) {
    return null;
  }
  return { id: user.id, name: user.name, email: user.email };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}
