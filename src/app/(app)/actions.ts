"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { db } from "@/server/db";
import { isUniqueViolation } from "@/server/prisma-errors";
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

  const slug = await createWithFreeSlug(name, user.id, baseSlug, 0);
  if (slug === null) {
    return {
      status: "error",
      message: "Não foi possível criar o workspace. Tente de novo.",
    };
  }

  revalidatePath("/", "layout");
  return redirect(`/w/${slug}`);
}

async function createWithFreeSlug(
  name: string,
  userId: string,
  baseSlug: string,
  attempt: number,
): Promise<string | null> {
  if (attempt >= SLUG_ATTEMPTS) {
    return null;
  }

  const slug = attempt === 0 ? baseSlug : withRandomSuffix(baseSlug);
  try {
    await db.workspace.create({
      data: {
        name,
        slug,
        memberships: { create: { userId, role: "OWNER" } },
      },
    });
    return slug;
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  return createWithFreeSlug(name, userId, baseSlug, attempt + 1);
}
