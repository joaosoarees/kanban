import "server-only";
import { UNLOCKED_PASSWORD } from "@/features/auth/server/password-check";
import { signUpAttemptMail } from "@/features/auth/emails/sign-up-attempt";
import { verifyEmailMail } from "@/features/auth/emails/verify-email";
import {
  RESEND_INTERVAL_MS,
  secondsUntilResend,
} from "@/features/auth/lib/email-code";
import {
  consumeCode,
  issueCode,
  resendCode,
} from "@/features/auth/server/email-code";
import { hashPassword } from "@/features/auth/server/password";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { sendMail } from "@/server/mail/send";
import type { PendingToken, PendingVerification } from "@/server/session";

type Delivery =
  | { kind: "code"; to: string; name: string; code: string }
  | { kind: "notice"; to: string; name: string }
  | { kind: "none" };

export type Registration = { pending: PendingVerification; delivered: boolean };

export type Resend =
  | { status: "sent"; waitSeconds: number }
  | { status: "wait"; waitSeconds: number }
  | { status: "failed" }
  | { status: "expired" };

const RESEND_SECONDS = RESEND_INTERVAL_MS / 1000;

async function deliver(delivery: Delivery): Promise<boolean> {
  if (delivery.kind === "code") {
    return sendMail(await verifyEmailMail(delivery));
  }
  if (delivery.kind === "notice") {
    return sendMail(await signUpAttemptMail(delivery));
  }
  return true;
}

function verifyOwner(userId: string) {
  return { userId, purpose: "VERIFY_EMAIL" as const };
}

async function lockAccount(tx: Prisma.TransactionClient, userId: string) {
  const rows = await tx.$queryRaw<
    {
      email: string;
      name: string;
      createdAt: Date;
      emailVerifiedAt: Date | null;
      passwordChangedAt: Date | null;
    }[]
  >`SELECT email, name, "createdAt", "emailVerifiedAt", "passwordChangedAt" FROM users WHERE id = ${userId}::uuid FOR NO KEY UPDATE`;
  return rows.at(0);
}

export async function registerAccount(
  input: { name: string; email: string; password: string },
  now: Date,
): Promise<Registration> {
  const passwordHash = await hashPassword(input.password);
  const { name, email } = input;

  const { pending, delivery } = await db.$transaction(async (tx) => {
    const inserted = await tx.user.createManyAndReturn({
      data: { name, email, passwordHash, createdAt: now },
      skipDuplicates: true,
      select: { id: true },
    });
    const created = inserted.at(0);
    if (created !== undefined) {
      const code = await issueCode(tx, verifyOwner(created.id), now);
      return {
        pending: { userId: created.id, registeredAt: now },
        delivery: { kind: "code", to: email, name, code } satisfies Delivery,
      };
    }

    const rows = await tx.$queryRaw<
      {
        id: string;
        name: string;
        createdAt: Date;
        emailVerifiedAt: Date | null;
      }[]
    >`SELECT id, name, "createdAt", "emailVerifiedAt" FROM users WHERE email = ${email} FOR UPDATE`;
    const existing = rows.at(0);
    if (existing === undefined) {
      throw new Error("A user that blocked the insert must exist.");
    }
    if (existing.emailVerifiedAt !== null) {
      return {
        pending: { userId: existing.id, registeredAt: existing.createdAt },
        delivery: {
          kind: "notice",
          to: email,
          name: existing.name,
        } satisfies Delivery,
      };
    }

    await tx.user.update({
      where: { id: existing.id },
      data: {
        name,
        passwordHash,
        createdAt: now,
        passwordChangedAt: now,
        ...UNLOCKED_PASSWORD,
      },
      select: { id: true },
    });
    const resent = await resendCode(tx, verifyOwner(existing.id), now);
    return {
      pending: { userId: existing.id, registeredAt: now },
      delivery:
        "code" in resent
          ? ({
              kind: "code",
              to: email,
              name,
              code: resent.code,
            } satisfies Delivery)
          : ({ kind: "none" } satisfies Delivery),
    };
  });

  return { pending, delivered: await deliver(delivery) };
}

export async function resumeVerification(
  userId: string,
  now: Date,
): Promise<Registration | null> {
  const result = await db.$transaction(async (tx) => {
    const account = await lockAccount(tx, userId);
    if (account?.emailVerifiedAt !== null) {
      return null;
    }
    const resent = await resendCode(tx, verifyOwner(userId), now);
    const delivery: Delivery =
      "code" in resent
        ? {
            kind: "code",
            to: account.email,
            name: account.name,
            code: resent.code,
          }
        : { kind: "none" };
    return {
      pending: { userId, registeredAt: account.createdAt },
      delivery,
    };
  });
  if (result === null) {
    return null;
  }
  return { pending: result.pending, delivered: await deliver(result.delivery) };
}

export async function verifyEmail(
  pending: PendingVerification,
  code: string,
  now: Date,
): Promise<
  | { status: "verified"; passwordChangedAt: Date | null }
  | { status: "invalid" }
  | { status: "expired" }
> {
  return db.$transaction(async (tx) => {
    const account = await lockAccount(tx, pending.userId);
    if (
      account === undefined ||
      account.createdAt.getTime() !== pending.registeredAt.getTime()
    ) {
      return { status: "expired" };
    }
    if (account.emailVerifiedAt !== null) {
      return { status: "invalid" };
    }
    const consumed = await consumeCode(
      tx,
      verifyOwner(pending.userId),
      code,
      now,
    );
    if (consumed === null) {
      return { status: "invalid" };
    }
    await tx.user.update({
      where: { id: pending.userId },
      data: { emailVerifiedAt: now },
      select: { id: true },
    });
    return { status: "verified", passwordChangedAt: account.passwordChangedAt };
  });
}

export async function resendVerification(
  pending: PendingToken,
  now: Date,
): Promise<Resend> {
  const result = await db.$transaction(async (tx) => {
    const account = await lockAccount(tx, pending.userId);
    if (
      account === undefined ||
      account.createdAt.getTime() !== pending.registeredAt.getTime()
    ) {
      return { status: "expired" } as const;
    }
    if (account.emailVerifiedAt !== null) {
      const waitSeconds = secondsUntilResend(pending.issuedAt, now);
      return waitSeconds > 0
        ? ({ status: "wait", waitSeconds } as const)
        : ({ status: "sent", delivery: { kind: "none" } as Delivery } as const);
    }
    const resent = await resendCode(tx, verifyOwner(pending.userId), now);
    if ("waitSeconds" in resent) {
      return { status: "wait", waitSeconds: resent.waitSeconds } as const;
    }
    return {
      status: "sent",
      delivery: {
        kind: "code",
        to: account.email,
        name: account.name,
        code: resent.code,
      } as Delivery,
    } as const;
  });

  if (result.status !== "sent") {
    return result;
  }
  return (await deliver(result.delivery))
    ? { status: "sent", waitSeconds: RESEND_SECONDS }
    : { status: "failed" };
}

export async function loadPendingVerification(
  pending: PendingToken,
): Promise<{ email: string; waitSeconds: number } | null> {
  const account = await db.user.findUnique({
    where: { id: pending.userId },
    select: {
      email: true,
      createdAt: true,
      emailVerifiedAt: true,
      emailCodes: {
        where: { purpose: "VERIFY_EMAIL" },
        select: { sentAt: true },
      },
    },
  });
  if (
    account === null ||
    account.createdAt.getTime() !== pending.registeredAt.getTime()
  ) {
    return null;
  }
  const sentAt =
    account.emailVerifiedAt === null
      ? account.emailCodes.at(0)?.sentAt
      : pending.issuedAt;
  return {
    email: account.email,
    waitSeconds:
      sentAt === undefined ? 0 : secondsUntilResend(sentAt, new Date()),
  };
}
