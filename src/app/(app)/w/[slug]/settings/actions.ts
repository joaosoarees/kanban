"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, type WorkspaceAction } from "@/lib/permissions";
import { isUniqueViolation } from "@/lib/prisma-errors";
import {
  addMemberSchema,
  changeRoleSchema,
  removeMemberSchema,
  renameWorkspaceSchema,
} from "@/lib/workspace-schemas";

const FORBIDDEN: ActionResult = {
  status: "error",
  message: "Você não tem permissão para fazer isso.",
};

const INVALID: ActionResult = {
  status: "error",
  message: "Confira os campos e tente de novo.",
};

function invalidFields(error: z.ZodError): ActionResult {
  return {
    status: "error",
    message: "Confira os campos e tente de novo.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

async function loadActor(workspaceId: unknown) {
  const user = await requireUser();
  const id = z.uuid().safeParse(workspaceId);
  if (!id.success) return null;

  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: id.data } },
    select: { role: true, workspace: { select: { slug: true, name: true } } },
  });
  if (!membership) return null;

  return {
    userId: user.id,
    workspaceId: id.data,
    role: membership.role,
    slug: membership.workspace.slug,
    name: membership.workspace.name,
  };
}

async function loadTarget(workspaceId: string, userId: string) {
  return db.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
}

function revalidateWorkspace(slug: string) {
  revalidatePath(`/w/${slug}`, "layout");
}

async function loadActorAllowedTo(
  workspaceId: unknown,
  action: WorkspaceAction,
) {
  const actor = await loadActor(workspaceId);
  if (!actor || !can(actor.role, action)) return null;
  return actor;
}

export async function addMemberAction(
  workspaceId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "addMember");
  if (!actor) return FORBIDDEN;

  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true },
  });
  if (!user) {
    const message =
      "Nenhuma conta com esse e-mail. Peça para a pessoa se cadastrar primeiro.";
    return { status: "error", message, fieldErrors: { email: [message] } };
  }

  try {
    await db.membership.create({
      data: {
        userId: user.id,
        workspaceId: actor.workspaceId,
        role: parsed.data.role,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const message = `${user.name} já faz parte do workspace.`;
      return { status: "error", message, fieldErrors: { email: [message] } };
    }
    throw error;
  }

  revalidateWorkspace(actor.slug);
  return { status: "success", data: undefined };
}

export async function changeRoleAction(
  workspaceId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActor(workspaceId);
  const parsed = changeRoleSchema.safeParse(input);
  if (!actor) return FORBIDDEN;
  if (!parsed.success) return INVALID;

  const target = await loadTarget(actor.workspaceId, parsed.data.userId);
  if (!target) {
    revalidateWorkspace(actor.slug);
    return { status: "error", message: "Essa pessoa já saiu do workspace." };
  }
  if (
    !can(actor.role, "changeRole", {
      role: target.role,
      isSelf: parsed.data.userId === actor.userId,
    })
  ) {
    return FORBIDDEN;
  }

  await db.membership.update({
    where: {
      userId_workspaceId: {
        userId: parsed.data.userId,
        workspaceId: actor.workspaceId,
      },
    },
    data: { role: parsed.data.role },
  });

  revalidateWorkspace(actor.slug);
  return { status: "success", data: undefined };
}

export async function removeMemberAction(
  workspaceId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActor(workspaceId);
  const parsed = removeMemberSchema.safeParse(input);
  if (!actor) return FORBIDDEN;
  if (!parsed.success) return INVALID;

  const target = await loadTarget(actor.workspaceId, parsed.data.userId);
  if (!target) {
    revalidateWorkspace(actor.slug);
    return { status: "success", data: undefined };
  }
  if (
    !can(actor.role, "removeMember", {
      role: target.role,
      isSelf: parsed.data.userId === actor.userId,
    })
  ) {
    return FORBIDDEN;
  }

  await db.membership.delete({
    where: {
      userId_workspaceId: {
        userId: parsed.data.userId,
        workspaceId: actor.workspaceId,
      },
    },
  });

  revalidateWorkspace(actor.slug);
  return { status: "success", data: undefined };
}

export async function leaveWorkspaceAction(
  workspaceId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "leaveWorkspace");
  if (!actor) return FORBIDDEN;

  await db.membership.delete({
    where: {
      userId_workspaceId: {
        userId: actor.userId,
        workspaceId: actor.workspaceId,
      },
    },
  });

  revalidatePath("/", "layout");
  redirect("/");
}

export async function renameWorkspaceAction(
  workspaceId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "renameWorkspace");
  if (!actor) return FORBIDDEN;

  const parsed = renameWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  await db.workspace.update({
    where: { id: actor.workspaceId },
    data: { name: parsed.data.name },
  });

  revalidatePath("/", "layout");
  return { status: "success", data: undefined };
}

export async function deleteWorkspaceAction(
  workspaceId: unknown,
  confirmation: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "deleteWorkspace");
  if (!actor) return FORBIDDEN;
  if (confirmation !== actor.name) {
    return {
      status: "error",
      message: "Digite o nome do workspace exatamente como aparece.",
    };
  }

  await db.workspace.delete({ where: { id: actor.workspaceId } });

  revalidatePath("/", "layout");
  redirect("/");
}
