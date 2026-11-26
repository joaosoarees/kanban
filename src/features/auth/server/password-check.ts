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

type Reservation =
  | { status: "locked"; minutes: number }
  | { status: "reserved"; passwordHash: string; lockedUntil: Date | null };

async function reserveAttempt(userId: string, now: Date): Promise<Reservation> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR NO KEY UPDATE`;
    const guard = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: GUARD_SELECT,
    });
    if (isPasswordLocked(guard, now)) {
      return { status: "locked", minutes: minutesUntilUnlock(guard, now) };
    }
    const next = afterPasswordFailure(guard, now);
    await tx.user.update({ where: { id: userId }, data: next });
    return {
      status: "reserved",
      passwordHash: guard.passwordHash,
      lockedUntil: next.passwordLockedUntil,
    };
  });
}

export async function checkAccountPassword(
  userId: string,
  password: string,
  now: Date,
): Promise<PasswordCheck> {
  const reservation = await reserveAttempt(userId, now);
  if (reservation.status === "locked") {
    await verifyPassword(password);
    return reservation;
  }

  if (!(await verifyPassword(password, reservation.passwordHash))) {
    return { status: "wrong" };
  }

  await db.user.updateMany({
    where: {
      id: userId,
      passwordHash: reservation.passwordHash,
      passwordLockedUntil: reservation.lockedUntil,
    },
    data: UNLOCKED_PASSWORD,
  });
  return { status: "match", passwordHash: reservation.passwordHash };
}
