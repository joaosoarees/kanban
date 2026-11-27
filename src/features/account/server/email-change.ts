import "server-only";
import { emailChangeCodeMail } from "@/features/account/emails/email-change-code";
import { emailChangedMail } from "@/features/account/emails/email-changed";
import { secondsUntilResend } from "@/features/auth/lib/email-code";
import { consumeCode, issueCode } from "@/features/auth/server/email-code";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { sendMail } from "@/server/mail/send";
import { isUniqueViolation } from "@/server/prisma-errors";

type Account = { id: string; name: string; email: string };

type CodeDelivery = { to: string; name: string; code: string } | null;

export type EmailChange = { newEmail: string; waitSeconds: number };

export type EmailChangeRequest =
  | { status: "sent"; newEmail: string; delivered: boolean }
  | { status: "wait"; waitSeconds: number };

export type EmailChangeResend =
  | { status: "sent"; delivered: boolean }
  | { status: "wait"; waitSeconds: number }
  | { status: "gone" };

export type EmailChangeConfirmation =
  | { status: "changed"; email: string }
  | { status: "invalid" }
  | { status: "taken" };

function changeOwner(userId: string) {
  return { userId, purpose: "CHANGE_EMAIL" as const };
}

async function emailBelongsToSomeone(
  tx: Prisma.TransactionClient,
  email: string,
): Promise<boolean> {
  const owner = await tx.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return owner !== null;
}

async function deliverCode(delivery: CodeDelivery): Promise<boolean> {
  if (delivery === null) {
    return true;
  }
  try {
    return await sendMail(await emailChangeCodeMail(delivery));
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function lockAccount(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR NO KEY UPDATE`;
}

async function loadCode(tx: Prisma.TransactionClient, userId: string) {
  return tx.emailCode.findUnique({
    where: { userId_purpose: changeOwner(userId) },
    select: { newEmail: true, sentAt: true, expiresAt: true, attempts: true },
  });
}

export async function requestEmailChange(
  account: Account,
  newEmail: string,
  now: Date,
): Promise<EmailChangeRequest> {
  const result = await db.$transaction(async (tx) => {
    await lockAccount(tx, account.id);
    const current = await loadCode(tx, account.id);
    const waitSeconds = current ? secondsUntilResend(current.sentAt, now) : 0;
    if (waitSeconds > 0) {
      return { status: "wait", waitSeconds } as const;
    }
    const code = await issueCode(tx, changeOwner(account.id), now, newEmail);
    const taken = await emailBelongsToSomeone(tx, newEmail);
    return {
      status: "sent",
      delivery: taken ? null : { to: newEmail, name: account.name, code },
    } as const;
  });

  if (result.status === "wait") {
    return result;
  }
  return {
    status: "sent",
    newEmail,
    delivered: await deliverCode(result.delivery),
  };
}

export async function resendEmailChange(
  account: Account,
  now: Date,
): Promise<EmailChangeResend> {
  const result = await db.$transaction(async (tx) => {
    await lockAccount(tx, account.id);
    const current = await loadCode(tx, account.id);
    if (
      current?.newEmail === null ||
      current === null ||
      current.expiresAt.getTime() <= now.getTime()
    ) {
      return { status: "gone" } as const;
    }
    const { newEmail } = current;
    const waitSeconds = secondsUntilResend(current.sentAt, now);
    if (waitSeconds > 0) {
      return { status: "wait", waitSeconds } as const;
    }
    const code = await issueCode(tx, changeOwner(account.id), now, newEmail);
    const taken = await emailBelongsToSomeone(tx, newEmail);
    return {
      status: "sent",
      delivery: taken ? null : { to: newEmail, name: account.name, code },
    } as const;
  });

  if (result.status !== "sent") {
    return result;
  }
  return { status: "sent", delivered: await deliverCode(result.delivery) };
}

export async function confirmEmailChange(
  account: Account,
  code: string,
  now: Date,
): Promise<EmailChangeConfirmation> {
  let outcome: EmailChangeConfirmation;
  try {
    outcome = await db.$transaction(async (tx) => {
      await lockAccount(tx, account.id);
      const consumed = await consumeCode(
        tx,
        changeOwner(account.id),
        code,
        now,
      );
      const newEmail = consumed?.newEmail ?? null;
      if (newEmail === null) {
        return { status: "invalid" } as const;
      }
      if (await emailBelongsToSomeone(tx, newEmail)) {
        return { status: "taken" } as const;
      }
      await tx.user.update({
        where: { id: account.id },
        data: { email: newEmail },
        select: { id: true },
      });
      await tx.emailCode.deleteMany({
        where: {
          userId: account.id,
          purpose: { in: ["RESET_PASSWORD", "VERIFY_EMAIL"] },
        },
      });
      return { status: "changed", email: newEmail } as const;
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
    await cancelEmailChange(account.id, now);
    return { status: "taken" };
  }

  if (outcome.status === "changed") {
    try {
      await sendMail(
        await emailChangedMail({
          to: account.email,
          name: account.name,
          newEmail: outcome.email,
          changedAt: now,
        }),
      );
    } catch (error) {
      console.error(error);
    }
  }
  return outcome;
}

export async function cancelEmailChange(
  userId: string,
  now: Date,
): Promise<void> {
  await db.$transaction(async (tx) => {
    await lockAccount(tx, userId);
    const current = await loadCode(tx, userId);
    if (current === null || current.expiresAt.getTime() <= now.getTime()) {
      return;
    }
    const expiresAt = Math.max(now.getTime(), current.sentAt.getTime() + 1);
    await tx.emailCode.update({
      where: { userId_purpose: changeOwner(userId) },
      data: { expiresAt: new Date(expiresAt) },
      select: { userId: true },
    });
  });
}

export async function loadEmailChange(
  userId: string,
  now: Date,
): Promise<EmailChange | null> {
  const current = await loadCode(db, userId);
  const newEmail = current?.newEmail ?? null;
  if (
    current === null ||
    newEmail === null ||
    current.expiresAt.getTime() <= now.getTime()
  ) {
    return null;
  }
  return {
    newEmail,
    waitSeconds: secondsUntilResend(current.sentAt, now),
  };
}
