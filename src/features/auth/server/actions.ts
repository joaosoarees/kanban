"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import {
  EMAIL_TAKEN_MESSAGE,
  signInSchema,
  signUpSchema,
} from "@/features/auth/lib/schemas";
import {
  INVALID_CODE_MESSAGE,
  MAIL_FAILED_MESSAGE,
  PENDING_EXPIRED_MESSAGE,
  verifyCodeSchema,
} from "@/features/auth/lib/email-code";
import { hashPassword, verifyPassword } from "@/features/auth/server/password";
import {
  resendVerification,
  verifyEmail,
} from "@/features/auth/server/verification";
import {
  type ActionError,
  type ActionResult,
  invalidFields,
} from "@/lib/action-result";
import { db } from "@/server/db";
import { isUniqueViolation } from "@/server/prisma-errors";
import {
  endSession,
  getPendingVerification,
  startSession,
} from "@/server/session";

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

const PENDING_EXPIRED: ActionError = {
  status: "error",
  message: PENDING_EXPIRED_MESSAGE,
  gone: true,
};

export async function verifyEmailAction(input: unknown): Promise<ActionResult> {
  const parsed = verifyCodeSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const pending = await getPendingVerification();
  if (pending === null) {
    return PENDING_EXPIRED;
  }

  const outcome = await verifyEmail(pending, parsed.data.code, new Date());
  if (outcome === "expired") {
    return PENDING_EXPIRED;
  }
  if (outcome === "invalid") {
    return {
      status: "error",
      message: INVALID_CODE_MESSAGE,
      fieldErrors: { code: [INVALID_CODE_MESSAGE] },
    };
  }

  await startSession(pending.userId);
  return redirect(AFTER_SIGN_IN);
}

export async function resendCodeAction(): Promise<
  ActionResult<{ sent: boolean; waitSeconds: number }>
> {
  const pending = await getPendingVerification();
  if (pending === null) {
    return PENDING_EXPIRED;
  }

  const resend = await resendVerification(pending, new Date());
  if (resend.status === "expired") {
    return PENDING_EXPIRED;
  }
  if (resend.status === "failed") {
    return { status: "error", message: MAIL_FAILED_MESSAGE };
  }
  return {
    status: "success",
    data: { sent: resend.status === "sent", waitSeconds: resend.waitSeconds },
  };
}
