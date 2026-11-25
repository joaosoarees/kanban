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
  type PendingToken,
  type PendingVerification,
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

export type { PendingToken, PendingVerification };

export async function startPendingVerification(
  pending: PendingVerification,
): Promise<void> {
  await deleteSessionCookie();
  await writePendingCookie(await createPendingToken(pending));
}

export async function getPendingVerification(): Promise<PendingToken | null> {
  const cookieStore = await cookies();
  return verifyPendingToken(cookieStore.get(PENDING_COOKIE)?.value);
}

export async function endPendingVerification(): Promise<void> {
  await deletePendingCookie();
}

export async function endSession(): Promise<void> {
  await deleteSessionCookie();
}
