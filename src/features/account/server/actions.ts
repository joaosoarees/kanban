"use server";

import { revalidatePath } from "next/cache";
import {
  changePasswordSchema,
  emailChangeSchema,
  renameSchema,
} from "@/features/account/lib/schemas";
import {
  cancelEmailChange,
  confirmEmailChange,
  requestEmailChange,
  resendEmailChange,
} from "@/features/account/server/email-change";
import {
  INVALID_CODE_MESSAGE,
  MAIL_FAILED_MESSAGE,
  RESEND_INTERVAL_MS,
  verifyCodeSchema,
} from "@/features/auth/lib/email-code";
import { hashPassword, verifyPassword } from "@/features/auth/server/password";
import {
  invalidFields,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";
import { requireUser, startSession } from "@/server/session";

export async function renameAction(
  input: unknown,
): Promise<ActionResult<{ name: string }>> {
  const user = await requireUser();
  const parsed = renameSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const { name } = parsed.data;
  await db.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath("/", "layout");
  return { status: "success", data: { name } };
}

const WRONG_PASSWORD = "Senha atual incorreta.";

const EMAIL_TAKEN = "Este e-mail já está em uso. Escolha outro.";

const EMAIL_CHANGE_GONE: ActionError = {
  status: "error",
  message: "A troca de e-mail expirou. Comece de novo.",
  gone: true,
};

function waitForCode(waitSeconds: number): ActionError {
  return {
    status: "error",
    message: `Espere ${waitSeconds} s para pedir outro código.`,
  };
}

async function matchingPasswordHash(
  userId: string,
  password: string,
): Promise<string | null> {
  const { passwordHash } = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true },
  });
  return (await verifyPassword(password, passwordHash)) ? passwordHash : null;
}

export async function changePasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const { currentPassword, newPassword } = parsed.data;
  const currentHash = await matchingPasswordHash(user.id, currentPassword);
  if (currentHash === null) {
    return {
      status: "error",
      message: WRONG_PASSWORD,
      fieldErrors: { currentPassword: [WRONG_PASSWORD] },
    };
  }

  const passwordChangedAt = new Date();
  const passwordHash = await hashPassword(newPassword);
  const changed = await db.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: user.id, passwordHash: currentHash },
      data: { passwordHash, passwordChangedAt },
    });
    if (count === 0) {
      return false;
    }
    await tx.emailCode.deleteMany({
      where: { userId: user.id, purpose: "RESET_PASSWORD" },
    });
    return true;
  });
  if (!changed) {
    return {
      status: "error",
      message: "Sua senha mudou em outro lugar. Entre de novo para trocar.",
    };
  }
  await startSession({ userId: user.id, passwordChangedAt });
  return { status: "success", data: undefined };
}

export async function requestEmailChangeAction(
  input: unknown,
): Promise<ActionResult<{ newEmail: string; waitSeconds: number }>> {
  const user = await requireUser();
  const parsed = emailChangeSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const { newEmail, password } = parsed.data;
  if (newEmail === user.email) {
    const message = "Este já é o seu e-mail.";
    return { status: "error", message, fieldErrors: { newEmail: [message] } };
  }
  if ((await matchingPasswordHash(user.id, password)) === null) {
    return {
      status: "error",
      message: WRONG_PASSWORD,
      fieldErrors: { password: [WRONG_PASSWORD] },
    };
  }

  const request = await requestEmailChange(user, newEmail, new Date());
  if (request.status === "wait") {
    return waitForCode(request.waitSeconds);
  }
  if (!request.delivered) {
    return { status: "error", message: MAIL_FAILED_MESSAGE };
  }
  return {
    status: "success",
    data: { newEmail, waitSeconds: RESEND_INTERVAL_MS / 1000 },
  };
}

export async function resendEmailChangeAction(): Promise<
  ActionResult<{ waitSeconds: number }>
> {
  const user = await requireUser();
  const resend = await resendEmailChange(user, new Date());
  if (resend.status === "gone") {
    return EMAIL_CHANGE_GONE;
  }
  if (resend.status === "wait") {
    return waitForCode(resend.waitSeconds);
  }
  if (!resend.delivered) {
    return { status: "error", message: MAIL_FAILED_MESSAGE };
  }
  return {
    status: "success",
    data: { waitSeconds: RESEND_INTERVAL_MS / 1000 },
  };
}

export async function confirmEmailChangeAction(
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  const user = await requireUser();
  const parsed = verifyCodeSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const outcome = await confirmEmailChange(user, parsed.data.code, new Date());
  if (outcome.status === "invalid") {
    return {
      status: "error",
      message: INVALID_CODE_MESSAGE,
      fieldErrors: { code: [INVALID_CODE_MESSAGE] },
    };
  }
  if (outcome.status === "taken") {
    return { ...EMAIL_CHANGE_GONE, message: EMAIL_TAKEN };
  }
  revalidatePath("/", "layout");
  return { status: "success", data: { email: outcome.email } };
}

export async function cancelEmailChangeAction(): Promise<ActionResult> {
  const user = await requireUser();
  await cancelEmailChange(user.id, new Date());
  return { status: "success", data: undefined };
}
