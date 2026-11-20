"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { slugify, withRandomSuffix } from "@/lib/slug";
import { createWorkspaceSchema } from "@/lib/workspace-schemas";

const SLUG_ATTEMPTS = 4;

export async function createWorkspaceAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira o nome e tente de novo.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { name } = parsed.data;
  const baseSlug = slugify(name);

  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const slug = attempt === 0 ? baseSlug : withRandomSuffix(baseSlug);
    try {
      await db.workspace.create({
        data: {
          name,
          slug,
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
    revalidatePath("/", "layout");
    redirect(`/w/${slug}`);
  }

  return {
    status: "error",
    message: "Não foi possível criar o workspace. Tente de novo.",
  };
}
