"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addMemberSchema,
  changeRoleSchema,
  removeMemberSchema,
} from "@/features/members/schemas";
import {
  loadActor,
  loadActorAllowedTo,
  revalidateWorkspace,
} from "@/features/workspaces/access";
import { can } from "@/features/workspaces/permissions";
import type { Role } from "@/generated/prisma/client";
import {
  FORBIDDEN,
  INVALID,
  invalidFields,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";
import { isUniqueViolation } from "@/server/prisma-errors";

const MEMBER_CHANGED: ActionError = {
  status: "error",
  message: "Os dados dessa pessoa mudaram. Confira e tente de novo.",
};

async function removeMembership(target: {
  workspaceId: string;
  userId: string;
  role?: Role;
}) {
  const { workspaceId, userId } = target;
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM boards
      WHERE "workspaceId" = ${workspaceId}::uuid
      ORDER BY id
      FOR UPDATE
    `;

    const { count } = await tx.membership.deleteMany({ where: target });
    if (count === 0) {
      return false;
    }

    await tx.card.updateMany({
      where: { assigneeId: userId, column: { board: { workspaceId } } },
      data: { assigneeId: null },
    });
    return true;
  });
}

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

  const { count } = await db.membership.updateMany({
    where: {
      userId: parsed.data.userId,
      workspaceId: actor.workspaceId,
      role: target.role,
    },
    data: { role: parsed.data.role },
  });

  revalidateWorkspace(actor.slug);
  return count === 0 ? MEMBER_CHANGED : { status: "success", data: undefined };
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

  const removed = await removeMembership({
    workspaceId: actor.workspaceId,
    userId: parsed.data.userId,
    role: target.role,
  });

  revalidateWorkspace(actor.slug);
  return removed ? { status: "success", data: undefined } : MEMBER_CHANGED;
}

export async function leaveWorkspaceAction(
  workspaceId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "leaveWorkspace");
  if (!actor) {
    return FORBIDDEN;
  }

  await removeMembership({
    workspaceId: actor.workspaceId,
    userId: actor.userId,
  });

  revalidatePath("/", "layout");
  return redirect("/");
}
