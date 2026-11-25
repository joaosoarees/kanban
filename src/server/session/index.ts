import "server-only";
import { cookies } from "next/headers";
import {
  deletePendingCookie,
  deleteResetCookie,
  deleteSessionCookie,
  PENDING_COOKIE,
  RESET_COOKIE,
  writePendingCookie,
  writeResetCookie,
  writeSessionCookie,
} from "@/server/session/cookie";
import {
  createPendingToken,
  createResetGrant,
  createResetToken,
  createSessionToken,
  type PendingToken,
  type PendingVerification,
  type ResetGrant,
  type ResetToken,
  type SessionOwner,
  verifyPendingToken,
  verifyResetGrant,
  verifyResetToken,
} from "@/server/session/token";

export {
  getCurrentUser,
  requireUser,
  type SessionUser,
} from "@/server/session/current-user";

export async function startSession(owner: SessionOwner): Promise<void> {
  await deletePendingCookie();
  await deleteResetCookie();
  await writeSessionCookie(await createSessionToken(owner));
}

export type {
  PendingToken,
  PendingVerification,
  ResetGrant,
  ResetToken,
  SessionOwner,
};

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

export async function startPasswordReset(email: string): Promise<void> {
  await writeResetCookie(await createResetToken(email));
}

export async function getPasswordReset(): Promise<ResetToken | null> {
  const cookieStore = await cookies();
  return verifyResetToken(cookieStore.get(RESET_COOKIE)?.value);
}

export async function grantPasswordReset(userId: string): Promise<void> {
  await writeResetCookie(await createResetGrant(userId));
}

export async function getPasswordResetGrant(): Promise<ResetGrant | null> {
  const cookieStore = await cookies();
  return verifyResetGrant(cookieStore.get(RESET_COOKIE)?.value);
}

export async function endPasswordReset(): Promise<void> {
  await deleteResetCookie();
}
