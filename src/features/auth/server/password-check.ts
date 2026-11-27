import "server-only";
import {
  afterPasswordFailure,
  afterPasswordMatch,
  isPasswordLocked,
  minutesUntilUnlock,
  type PasswordGuard,
} from "@/features/auth/lib/password-lock";
import { verifyPassword } from "@/features/auth/server/password";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export type PasswordCheck =
  | { status: "match"; passwordHash: string }
  | { status: "wrong" }
  | { status: "locked"; minutes: number };

const GUARD_SELECT = {
  passwordHash: true,
  failedPasswordAttempts: true,
  passwordLockedUntil: true,
} as const;

type Reservation =
  | { status: "locked"; minutes: number }
  | { status: "reserved"; passwordHash: string; reserved: PasswordGuard };

async function lockUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR NO KEY UPDATE`;
}

async function reserveAttempt(userId: string, now: Date): Promise<Reservation> {
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const guard = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: GUARD_SELECT,
    });
    if (isPasswordLocked(guard, now)) {
      return { status: "locked", minutes: minutesUntilUnlock(guard, now) };
    }
    const next = afterPasswordFailure(guard, now);
    await tx.user.update({
      where: { id: userId },
      data: next,
      select: { id: true },
    });
    return {
      status: "reserved",
      passwordHash: guard.passwordHash,
      reserved: next,
    };
  });
}

async function settleMatch(
  userId: string,
  passwordHash: string,
  reserved: PasswordGuard,
): Promise<void> {
  await db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const current = await tx.user.findUnique({
      where: { id: userId },
      select: GUARD_SELECT,
    });
    if (current?.passwordHash !== passwordHash) {
      return;
    }
    await tx.user.update({
      where: { id: userId },
      data: afterPasswordMatch(current, reserved),
      select: { id: true },
    });
  });
}

export async function checkAccountPassword(
  userId: string,
  password: string,
  now: Date,
): Promise<PasswordCheck> {
  const reservation = await reserveAttempt(userId, now);
  if (reservation.status === "locked") {
    await verifyPassword(password, null);
    return reservation;
  }

  if (!(await verifyPassword(password, reservation.passwordHash))) {
    return { status: "wrong" };
  }

  await settleMatch(userId, reservation.passwordHash, reservation.reserved);
  return { status: "match", passwordHash: reservation.passwordHash };
}
