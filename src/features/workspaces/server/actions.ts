"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import {
  createWorkspaceSchema,
  renameWorkspaceSchema,
} from "@/features/workspaces/lib/schemas";
import { slugify, withRandomSuffix } from "@/features/workspaces/lib/slug";
import {
  loadActorAllowedTo,
  WORKSPACE_GONE,
} from "@/features/workspaces/server/access";
import {
  FORBIDDEN,
  invalidFields,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";
import { isUniqueViolation } from "@/server/prisma-errors";
import { requireUser } from "@/server/session";

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

export async function renameWorkspaceAction(
  workspaceId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "renameWorkspace");
  if (!actor) {
    return FORBIDDEN;
  }

  const parsed = renameWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const { count } = await db.workspace.updateMany({
    where: { id: actor.workspaceId },
    data: { name: parsed.data.name },
  });
  if (count === 0) {
    return WORKSPACE_GONE;
  }

  revalidatePath("/", "layout");
  return { status: "success", data: undefined };
}

export async function deleteWorkspaceAction(
  workspaceId: unknown,
  confirmation: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "deleteWorkspace");
  if (!actor) {
    return FORBIDDEN;
  }
  if (confirmation !== actor.name) {
    return {
      status: "error",
      message: "Digite o nome do workspace exatamente como aparece.",
    };
  }

  await db.workspace.deleteMany({ where: { id: actor.workspaceId } });

  revalidatePath("/", "layout");
  return redirect("/");
}
