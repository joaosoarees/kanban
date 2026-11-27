"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
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
import { can } from "@/features/workspaces/lib/permissions";
import type { Prisma, Role } from "@/generated/prisma/client";
import {
  FORBIDDEN,
  INVALID,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { db } from "@/server/db";

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
  await tx.invite.deleteMany({ where: { workspaceId, invitedById: userId } });
  return null;
}

async function loadTarget(
  client: Prisma.TransactionClient,
  workspaceId: string,
  userId: string,
) {
  return client.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
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
  const target = await loadTarget(db, actor.workspaceId, userId);
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
    if (count === 0) {
      return MEMBER_CHANGED;
    }
    if (!can(role, "inviteMember")) {
      await tx.invite.deleteMany({
        where: { workspaceId: actor.workspaceId, invitedById: userId },
      });
    }
    return null;
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
  const target = await loadTarget(db, actor.workspaceId, userId);
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
    const current = await loadTarget(tx, actor.workspaceId, actor.userId);
    if (!current) {
      return null;
    }
    return removeMembership(tx, {
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      role: current.role,
    });
  });
  if (refused && refused !== WORKSPACE_GONE) {
    return refused;
  }

  revalidatePath("/", "layout");
  return redirect("/");
}
