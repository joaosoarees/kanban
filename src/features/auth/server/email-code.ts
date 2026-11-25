import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import {
  CODE_LENGTH,
  codeExpiresAt,
  isCodeUsable,
  secondsUntilResend,
} from "@/features/auth/lib/email-code";
import type { Prisma } from "@/generated/prisma/client";
import type { EmailCodePurpose } from "@/generated/prisma/enums";

type Owner = { userId: string; purpose: EmailCodePurpose };

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

async function lockUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR NO KEY UPDATE`;
}

export async function issueCode(
  tx: Prisma.TransactionClient,
  owner: Owner,
  now: Date,
): Promise<string> {
  const code = randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, "0");
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
  await lockUser(tx, owner.userId);
  const current = await tx.emailCode.findUnique({
    where: { userId_purpose: owner },
    select: { sentAt: true },
  });
  const waitSeconds = current ? secondsUntilResend(current.sentAt, now) : 0;
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
): Promise<boolean> {
  await lockUser(tx, owner.userId);
  const where = { userId_purpose: owner };
  const stored = await tx.emailCode.findUnique({
    where,
    select: { codeHash: true, expiresAt: true, attempts: true },
  });
  if (!stored || !isCodeUsable(stored, now)) {
    return false;
  }

  const matches = timingSafeEqual(
    Buffer.from(stored.codeHash, "hex"),
    hashCode(owner, code),
  );
  if (matches) {
    await tx.emailCode.delete({ where });
  } else {
    await tx.emailCode.update({
      where,
      data: { attempts: stored.attempts + 1 },
    });
  }
  return matches;
}
