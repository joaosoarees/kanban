import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { isWriteConflict } from "@/server/prisma-errors";

const MAX_ATTEMPTS = 3;

type Run<T> = (tx: Prisma.TransactionClient) => Promise<T>;

async function attempt<T>(run: Run<T>, attemptsLeft: number): Promise<T> {
  try {
    return await db.$transaction(run);
  } catch (error) {
    if (attemptsLeft <= 1 || !isWriteConflict(error)) {
      throw error;
    }
    return attempt(run, attemptsLeft - 1);
  }
}

export async function transact<T>(run: Run<T>): Promise<T> {
  return attempt(run, MAX_ATTEMPTS);
}
