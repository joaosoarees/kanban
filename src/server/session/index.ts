import "server-only";
import {
  deleteSessionCookie,
  writeSessionCookie,
} from "@/server/session/cookie";
import { createSessionToken } from "@/server/session/token";

export {
  getCurrentUser,
  requireUser,
  type SessionUser,
} from "@/server/session/current-user";

export async function startSession(userId: string): Promise<void> {
  await writeSessionCookie(await createSessionToken(userId));
}

export async function endSession(): Promise<void> {
  await deleteSessionCookie();
}
