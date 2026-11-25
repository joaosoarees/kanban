"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import type { ActionResult } from "@/lib/action-result";
import {
  EMAIL_TAKEN_MESSAGE,
  signInSchema,
  signUpSchema,
} from "@/lib/auth-schemas";
import { hashPassword, verifyPassword } from "@/lib/password";
import { db } from "@/server/db";
import { isUniqueViolation } from "@/server/prisma-errors";
import { endSession, startSession } from "@/server/session";

const AFTER_SIGN_IN = "/";

export async function signUpAction(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos e tente de novo.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  let userId: string;
  try {
    const user = await db.user.create({
      data: { name, email, passwordHash },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        message: EMAIL_TAKEN_MESSAGE,
        fieldErrors: { email: [EMAIL_TAKEN_MESSAGE] },
      };
    }
    throw error;
  }

  await startSession(userId);
  return redirect(AFTER_SIGN_IN);
}

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos e tente de novo.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true },
  });

  const matches = await verifyPassword(
    parsed.data.password,
    user?.passwordHash,
  );
  if (!user || !matches) {
    return {
      status: "error",
      message: "E-mail ou senha incorretos. Confira e tente de novo.",
    };
  }

  await startSession(user.id);
  return redirect(AFTER_SIGN_IN);
}

export async function signOutAction(): Promise<void> {
  await endSession();
  return redirect("/sign-in");
}
