import "server-only";
import { cookies } from "next/headers";
import {
  deletePendingCookie,
  deleteSessionCookie,
  PENDING_COOKIE,
  writePendingCookie,
  writeSessionCookie,
} from "@/server/session/cookie";
import {
  createPendingToken,
  createSessionToken,
  verifyPendingToken,
} from "@/server/session/token";

export {
  getCurrentUser,
  requireUser,
  type SessionUser,
} from "@/server/session/current-user";

export async function startSession(userId: string): Promise<void> {
  await deletePendingCookie();
  await writeSessionCookie(await createSessionToken(userId));
}

export async function startPendingVerification(userId: string): Promise<void> {
  await deleteSessionCookie();
  await writePendingCookie(await createPendingToken(userId));
}

export async function getPendingUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const pending = await verifyPendingToken(
    cookieStore.get(PENDING_COOKIE)?.value,
  );
  return pending?.userId ?? null;
}

export async function endPendingVerification(): Promise<void> {
  await deletePendingCookie();
}

export async function endSession(): Promise<void> {
  await deleteSessionCookie();
}
