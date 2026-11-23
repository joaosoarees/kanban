"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  FORBIDDEN,
  INVALID,
  invalidFields,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { isUniqueViolation } from "@/lib/prisma-errors";
import {
  addMemberSchema,
  changeRoleSchema,
  removeMemberSchema,
  renameWorkspaceSchema,
} from "@/lib/workspace-schemas";
import {
  loadActor,
  loadActorAllowedTo,
  removeMembership,
  revalidateWorkspace,
} from "@/lib/workspaces";

async function loadTarget(workspaceId: string, userId: string) {
  return db.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
}

export async function addMemberAction(
  workspaceId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "addMember");
  if (!actor) {
    return FORBIDDEN;
  }

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
  if (!actor) {
    return FORBIDDEN;
  }
  if (!parsed.success) {
    return INVALID;
  }

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
  if (!actor) {
    return FORBIDDEN;
  }
  if (!parsed.success) {
    return INVALID;
  }

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

  await removeMembership(actor.workspaceId, parsed.data.userId);

  revalidateWorkspace(actor.slug);
  return { status: "success", data: undefined };
}

export async function leaveWorkspaceAction(
  workspaceId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "leaveWorkspace");
  if (!actor) {
    return FORBIDDEN;
  }

  await removeMembership(actor.workspaceId, actor.userId);

  revalidatePath("/", "layout");
  return redirect("/");
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
  if (!actor) {
    return FORBIDDEN;
  }
  if (confirmation !== actor.name) {
    return {
      status: "error",
      message: "Digite o nome do workspace exatamente como aparece.",
    };
  }

  await db.workspace.delete({ where: { id: actor.workspaceId } });

  revalidatePath("/", "layout");
  return redirect("/");
}
