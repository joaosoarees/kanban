"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import * as z from "zod";
import { RESET_EXPIRED_MESSAGE } from "@/features/auth/lib/password-reset";
import {
  EMAIL_TAKEN_MESSAGE,
  newPasswordSchema,
  resetRequestSchema,
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
  checkResetCode,
  requestPasswordReset,
  resendPasswordReset,
  resetPassword,
  sendResetMail,
} from "@/features/auth/server/password-reset";
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
  getPasswordReset,
  getPasswordResetGrant,
  getPendingVerification,
  grantPasswordReset,
  startPasswordReset,
  startPendingVerification,
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

  await startSession({ userId, passwordChangedAt: null });
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
    select: { id: true, passwordHash: true, passwordChangedAt: true },
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

  await startSession({
    userId: user.id,
    passwordChangedAt: user.passwordChangedAt,
  });
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
  if (outcome.status === "expired") {
    return PENDING_EXPIRED;
  }
  if (outcome.status === "invalid") {
    return {
      status: "error",
      message: INVALID_CODE_MESSAGE,
      fieldErrors: { code: [INVALID_CODE_MESSAGE] },
    };
  }

  await startSession({
    userId: pending.userId,
    passwordChangedAt: outcome.passwordChangedAt,
  });
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
  if (resend.status === "sent") {
    await startPendingVerification(pending);
  }
  return {
    status: "success",
    data: { sent: resend.status === "sent", waitSeconds: resend.waitSeconds },
  };
}

const RESET_EXPIRED: ActionError = {
  status: "error",
  message: RESET_EXPIRED_MESSAGE,
  gone: true,
};

export async function requestPasswordResetAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const { email } = parsed.data;
  const mail = await requestPasswordReset(email, new Date());
  await startPasswordReset(email);
  if (mail !== null) {
    after(async () => sendResetMail(mail));
  }
  return { status: "success", data: undefined };
}

export async function resendResetCodeAction(): Promise<
  ActionResult<{ sent: boolean; waitSeconds: number }>
> {
  const reset = await getPasswordReset();
  if (reset === null) {
    return RESET_EXPIRED;
  }

  const resend = await resendPasswordReset(reset, new Date());
  if (resend.status === "sent") {
    await startPasswordReset(reset.email);
    const { mail } = resend;
    if (mail !== null) {
      after(async () => sendResetMail(mail));
    }
  }
  return {
    status: "success",
    data: { sent: resend.status === "sent", waitSeconds: resend.waitSeconds },
  };
}

export async function verifyResetCodeAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = verifyCodeSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const reset = await getPasswordReset();
  if (reset === null) {
    return RESET_EXPIRED;
  }

  const granted = await checkResetCode(reset, parsed.data.code, new Date());
  if (granted === null) {
    return {
      status: "error",
      message: INVALID_CODE_MESSAGE,
      fieldErrors: { code: [INVALID_CODE_MESSAGE] },
    };
  }

  await grantPasswordReset(granted.userId);
  return { status: "success", data: undefined };
}

export async function resetPasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const grant = await getPasswordResetGrant();
  if (grant === null) {
    return RESET_EXPIRED;
  }

  const passwordChangedAt = await resetPassword(
    grant,
    parsed.data.password,
    new Date(),
  );
  if (passwordChangedAt === null) {
    return RESET_EXPIRED;
  }

  await startSession({ userId: grant.userId, passwordChangedAt });
  return redirect(AFTER_SIGN_IN);
}
