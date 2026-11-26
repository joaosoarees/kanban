import "server-only";
import {
  afterPasswordFailure,
  isPasswordLocked,
  minutesUntilUnlock,
} from "@/features/auth/lib/password-lock";
import { verifyPassword } from "@/features/auth/server/password";
import { db } from "@/server/db";

export type PasswordCheck =
  | { status: "match"; passwordHash: string }
  | { status: "wrong" }
  | { status: "locked"; minutes: number };

export const UNLOCKED_PASSWORD = {
  failedPasswordAttempts: 0,
  passwordLockedUntil: null,
} as const;

const GUARD_SELECT = {
  passwordHash: true,
  failedPasswordAttempts: true,
  passwordLockedUntil: true,
} as const;

async function countFailure(userId: string, now: Date): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR NO KEY UPDATE`;
    const guard = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: GUARD_SELECT,
    });
    if (isPasswordLocked(guard, now)) {
      return;
    }
    await tx.user.update({
      where: { id: userId },
      data: afterPasswordFailure(guard, now),
    });
  });
}

export async function checkAccountPassword(
  userId: string,
  password: string,
  now: Date,
): Promise<PasswordCheck> {
  const guard = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: GUARD_SELECT,
  });
  if (isPasswordLocked(guard, now)) {
    await verifyPassword(password);
    return { status: "locked", minutes: minutesUntilUnlock(guard, now) };
  }

  if (!(await verifyPassword(password, guard.passwordHash))) {
    await countFailure(userId, now);
    return { status: "wrong" };
  }

  if (guard.failedPasswordAttempts > 0 || guard.passwordLockedUntil !== null) {
    await db.user.updateMany({
      where: { id: userId, passwordHash: guard.passwordHash },
      data: UNLOCKED_PASSWORD,
    });
  }
  return { status: "match", passwordHash: guard.passwordHash };
}
