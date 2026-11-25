import "server-only";
import { resetPasswordMail } from "@/features/auth/emails/reset-password";
import {
  RESEND_INTERVAL_MS,
  secondsUntilResend,
} from "@/features/auth/lib/email-code";
import { isResetGrantCurrent } from "@/features/auth/lib/password-reset";
import { consumeCode, resendCode } from "@/features/auth/server/email-code";
import { hashPassword } from "@/features/auth/server/password";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { sendMail } from "@/server/mail/send";
import type { ResetGrant, ResetToken } from "@/server/session";

export type ResetMail = { to: string; name: string; code: string };

export type ResetResend =
  | { status: "sent"; waitSeconds: number; mail: ResetMail | null }
  | { status: "wait"; waitSeconds: number };

const RESEND_SECONDS = RESEND_INTERVAL_MS / 1000;

function resetOwner(userId: string) {
  return { userId, purpose: "RESET_PASSWORD" as const };
}

async function lockUserByEmail(tx: Prisma.TransactionClient, email: string) {
  const rows = await tx.$queryRaw<{ id: string; name: string }[]>`
    SELECT id, name FROM users WHERE email = ${email} FOR NO KEY UPDATE`;
  return rows.at(0);
}

export async function sendResetMail(mail: ResetMail): Promise<void> {
  await sendMail(await resetPasswordMail(mail));
}

export async function requestPasswordReset(
  email: string,
  now: Date,
): Promise<ResetMail | null> {
  return db.$transaction(async (tx) => {
    const user = await lockUserByEmail(tx, email);
    if (user === undefined) {
      return null;
    }
    const resent = await resendCode(tx, resetOwner(user.id), now);
    return "code" in resent
      ? { to: email, name: user.name, code: resent.code }
      : null;
  });
}

export function resetWaitSeconds(reset: ResetToken, now: Date): number {
  return secondsUntilResend(reset.issuedAt, now);
}

export async function resendPasswordReset(
  reset: ResetToken,
  now: Date,
): Promise<ResetResend> {
  const waitSeconds = resetWaitSeconds(reset, now);
  if (waitSeconds > 0) {
    return { status: "wait", waitSeconds };
  }
  const mail = await requestPasswordReset(reset.email, now);
  return { status: "sent", waitSeconds: RESEND_SECONDS, mail };
}

export async function checkResetCode(
  reset: ResetToken,
  code: string,
  now: Date,
): Promise<{ userId: string } | null> {
  return db.$transaction(async (tx) => {
    const user = await lockUserByEmail(tx, reset.email);
    if (user === undefined) {
      return null;
    }
    const valid = await consumeCode(tx, resetOwner(user.id), code, now);
    return valid ? { userId: user.id } : null;
  });
}

export async function resetPassword(
  grant: ResetGrant,
  password: string,
  now: Date,
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      { passwordChangedAt: Date | null; emailVerifiedAt: Date | null }[]
    >`SELECT "passwordChangedAt", "emailVerifiedAt" FROM users WHERE id = ${grant.userId}::uuid FOR NO KEY UPDATE`;
    const user = rows.at(0);
    if (
      user === undefined ||
      !isResetGrantCurrent(grant.issuedAt, user.passwordChangedAt)
    ) {
      return false;
    }
    await tx.user.update({
      where: { id: grant.userId },
      data: {
        passwordHash,
        passwordChangedAt: now,
        emailVerifiedAt: user.emailVerifiedAt ?? now,
      },
    });
    await tx.emailCode.deleteMany({ where: resetOwner(grant.userId) });
    return true;
  });
}
