"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addMemberSchema,
  changeRoleSchema,
  removeMemberSchema,
} from "@/features/members/lib/schemas";
import {
  loadActor,
  loadActorAllowedTo,
  recheckActor,
  revalidateWorkspace,
  WORKSPACE_GONE,
} from "@/features/workspaces/server/access";
import type { Prisma, Role } from "@/generated/prisma/client";
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

async function removeMembership(
  tx: Prisma.TransactionClient,
  target: { workspaceId: string; userId: string; role: Role },
) {
  const { workspaceId, userId } = target;
  await tx.$queryRaw`
    SELECT id FROM boards
    WHERE "workspaceId" = ${workspaceId}::uuid
    ORDER BY id
    FOR UPDATE
  `;

  const { count } = await tx.membership.deleteMany({ where: target });
  if (count === 0) {
    return MEMBER_CHANGED;
  }

  await tx.card.updateMany({
    where: { assigneeId: userId, column: { board: { workspaceId } } },
    data: { assigneeId: null },
  });
  return null;
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

  const userId = user.id;
  try {
    const refused = await db.$transaction(async (tx) => {
      const denied = await recheckActor(tx, actor, "addMember");
      if (denied) {
        return denied;
      }
      await tx.membership.create({
        data: {
          userId,
          workspaceId: actor.workspaceId,
          role: parsed.data.role,
        },
      });
      return null;
    });
    if (refused) {
      return refused;
    }
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

  const { userId, role } = parsed.data;
  const target = await loadTarget(actor.workspaceId, userId);
  if (!target) {
    revalidateWorkspace(actor.slug);
    return { status: "error", message: "Essa pessoa já saiu do workspace." };
  }

  const refused = await db.$transaction(async (tx) => {
    const denied = await recheckActor(tx, actor, "changeRole", {
      role: target.role,
      isSelf: userId === actor.userId,
    });
    if (denied) {
      return denied;
    }
    const { count } = await tx.membership.updateMany({
      where: { userId, workspaceId: actor.workspaceId, role: target.role },
      data: { role },
    });
    return count === 0 ? MEMBER_CHANGED : null;
  });

  revalidateWorkspace(actor.slug);
  return refused ?? { status: "success", data: undefined };
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

  const { userId } = parsed.data;
  const target = await loadTarget(actor.workspaceId, userId);
  if (!target) {
    revalidateWorkspace(actor.slug);
    return { status: "success", data: undefined };
  }

  const refused = await db.$transaction(async (tx) => {
    const denied = await recheckActor(tx, actor, "removeMember", {
      role: target.role,
      isSelf: userId === actor.userId,
    });
    if (denied) {
      return denied;
    }
    return removeMembership(tx, {
      workspaceId: actor.workspaceId,
      userId,
      role: target.role,
    });
  });

  revalidateWorkspace(actor.slug);
  return refused ?? { status: "success", data: undefined };
}

export async function leaveWorkspaceAction(
  workspaceId: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "leaveWorkspace");
  if (!actor) {
    return FORBIDDEN;
  }

  const refused = await db.$transaction(async (tx) => {
    const denied = await recheckActor(tx, actor, "leaveWorkspace");
    if (denied) {
      return denied;
    }
    return removeMembership(tx, {
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      role: actor.role,
    });
  });
  if (refused && refused !== WORKSPACE_GONE) {
    return refused;
  }

  revalidatePath("/", "layout");
  return redirect("/");
}
