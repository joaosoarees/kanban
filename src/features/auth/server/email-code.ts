import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import {
  type AttemptWindow,
  codeExpiresAt,
  isCodeUsable,
  secondsUntilAttemptsReset,
  secondsUntilResend,
  windowAfterWrongAttempt,
} from "@/features/auth/lib/email-code";
import type { Prisma } from "@/generated/prisma/client";
import type { EmailCodePurpose } from "@/generated/prisma/enums";

type Owner = { userId: string; purpose: EmailCodePurpose };

export type CodeCheck =
  | { status: "valid" }
  | { status: "invalid" }
  | { status: "locked"; waitSeconds: number };

function getKey(): string {
  const secret = process.env.EMAIL_CODE_SECRET;
  if (secret === undefined || secret.length < 32) {
    throw new Error("EMAIL_CODE_SECRET must be set to at least 32 characters.");
  }
  return secret;
}

function hashCode({ userId, purpose }: Owner, code: string): Buffer {
  return createHmac("sha256", getKey())
    .update(`${purpose}:${userId}:${code}`)
    .digest();
}

async function lockUserWindow(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<AttemptWindow> {
  const rows = await tx.$queryRaw<
    { windowStartedAt: Date | null; windowAttempts: number }[]
  >`SELECT "codeWindowStartedAt" AS "windowStartedAt", "codeWindowAttempts" AS "windowAttempts" FROM users WHERE id = ${userId}::uuid FOR NO KEY UPDATE`;
  const row = rows.at(0);
  if (row === undefined) {
    throw new Error("The user of an e-mail code must exist.");
  }
  return row;
}

export async function issueCode(
  tx: Prisma.TransactionClient,
  owner: Owner,
  now: Date,
): Promise<string> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const fields = {
    codeHash: hashCode(owner, code).toString("hex"),
    sentAt: now,
    expiresAt: codeExpiresAt(now),
    attempts: 0,
  };
  await tx.emailCode.upsert({
    where: { userId_purpose: owner },
    create: { ...owner, ...fields },
    update: fields,
  });
  return code;
}

export async function resendCode(
  tx: Prisma.TransactionClient,
  owner: Owner,
  now: Date,
): Promise<{ code: string } | { waitSeconds: number }> {
  const window = await lockUserWindow(tx, owner.userId);
  const current = await tx.emailCode.findUnique({
    where: { userId_purpose: owner },
    select: { sentAt: true },
  });
  const waitSeconds = Math.max(
    current ? secondsUntilResend(current.sentAt, now) : 0,
    secondsUntilAttemptsReset(window, now),
  );
  if (waitSeconds > 0) {
    return { waitSeconds };
  }
  return { code: await issueCode(tx, owner, now) };
}

export async function consumeCode(
  tx: Prisma.TransactionClient,
  owner: Owner,
  code: string,
  now: Date,
): Promise<CodeCheck> {
  const window = await lockUserWindow(tx, owner.userId);
  const waitSeconds = secondsUntilAttemptsReset(window, now);
  if (waitSeconds > 0) {
    return { status: "locked", waitSeconds };
  }

  const where = { userId_purpose: owner };
  const stored = await tx.emailCode.findUnique({
    where,
    select: { codeHash: true, expiresAt: true, attempts: true },
  });
  if (!stored || !isCodeUsable(stored, now)) {
    return { status: "invalid" };
  }

  const matches = timingSafeEqual(
    Buffer.from(stored.codeHash, "hex"),
    hashCode(owner, code),
  );
  if (matches) {
    await tx.emailCode.delete({ where });
    return { status: "valid" };
  }

  const next = windowAfterWrongAttempt(window, now);
  await tx.emailCode.update({
    where,
    data: { attempts: stored.attempts + 1 },
  });
  await tx.user.update({
    where: { id: owner.userId },
    data: {
      codeWindowStartedAt: next.windowStartedAt,
      codeWindowAttempts: next.windowAttempts,
    },
  });
  return { status: "invalid" };
}
