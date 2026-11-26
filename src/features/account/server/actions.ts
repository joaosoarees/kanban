"use server";

import { revalidatePath } from "next/cache";
import { renameSchema } from "@/features/account/lib/schemas";
import { invalidFields, type ActionResult } from "@/lib/action-result";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

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
