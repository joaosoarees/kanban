"use server";

import { revalidatePath } from "next/cache";
import {
  changePasswordSchema,
  renameSchema,
} from "@/features/account/lib/schemas";
import { hashPassword, verifyPassword } from "@/features/auth/server/password";
import { invalidFields, type ActionResult } from "@/lib/action-result";
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

export async function changePasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const { currentPassword, newPassword } = parsed.data;
  const stored = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!(await verifyPassword(currentPassword, stored.passwordHash))) {
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
      where: { id: user.id, passwordHash: stored.passwordHash },
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
