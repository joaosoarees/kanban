"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { RESET_EXPIRED_MESSAGE } from "@/features/auth/lib/password-reset";
import {
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
import { verifyPassword } from "@/features/auth/server/password";
import { checkAccountPassword } from "@/features/auth/server/password-check";
import { enter } from "@/features/auth/server/enter";
import {
  checkResetCode,
  requestPasswordReset,
  resendPasswordReset,
  resetPassword,
  sendResetMail,
} from "@/features/auth/server/password-reset";
import {
  registerAccount,
  resendVerification,
  resumeVerification,
  verifyEmail,
} from "@/features/auth/server/verification";
import {
  type ActionError,
  type ActionResult,
  invalidFields,
} from "@/lib/action-result";
import { db } from "@/server/db";
import {
  endPasswordReset,
  endPendingVerification,
  endSession,
  forgetInvite,
  getPasswordReset,
  getPasswordResetGrant,
  getPendingVerification,
  grantPasswordReset,
  startPasswordReset,
  startPendingVerification,
  startSession,
} from "@/server/session";

const VERIFY_PATH = "/verify-email";

export async function signUpAction(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const { pending, delivered } = await registerAccount(parsed.data, new Date());
  await startPendingVerification(pending);
  if (!delivered) {
    return { status: "error", message: MAIL_FAILED_MESSAGE };
  }
  return redirect(VERIFY_PATH);
}

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordChangedAt: true, emailVerifiedAt: true },
  });

  const matches =
    user === null
      ? await verifyPassword(parsed.data.password)
      : (await checkAccountPassword(user.id, parsed.data.password, new Date()))
          .status === "match";
  if (user === null || !matches) {
    return {
      status: "error",
      message:
        "E-mail ou senha incorretos, ou muitas tentativas seguidas. Confira e tente de novo em alguns minutos.",
    };
  }

  if (user.emailVerifiedAt === null) {
    const resumed = await resumeVerification(user.id, new Date());
    if (resumed !== null) {
      await startPendingVerification(resumed.pending);
      if (!resumed.delivered) {
        return { status: "error", message: MAIL_FAILED_MESSAGE };
      }
      return redirect(VERIFY_PATH);
    }
  }

  await startSession({
    userId: user.id,
    passwordChangedAt: user.passwordChangedAt,
  });
  return enter(user.id);
}

export async function signOutAction(): Promise<ActionResult> {
  await forgetInvite();
  await endSession();
  return { status: "success", data: undefined };
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
  return enter(pending.userId);
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

export async function switchAccountAction(): Promise<void> {
  await endPendingVerification();
  return redirect("/sign-in");
}

const RESET_PATH = "/reset-password";

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
  return redirect(RESET_PATH);
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
  return redirect(RESET_PATH);
}

export async function restartPasswordResetAction(): Promise<void> {
  await endPasswordReset();
  return redirect("/forgot-password");
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
  return enter(grant.userId);
}
