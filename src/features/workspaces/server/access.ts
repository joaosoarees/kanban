import "server-only";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { cache } from "react";
import * as z from "zod";
import {
  can,
  type WorkspaceAction,
} from "@/features/workspaces/lib/permissions";
import type { WorkspaceSummary } from "@/features/workspaces/server/queries";
import { hasNoNul } from "@/lib/text";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export function revalidateWorkspace(slug: string) {
  revalidatePath(`/w/${slug}`, "layout");
}

export async function loadActor(workspaceId: unknown) {
  const user = await requireUser();
  const id = z.uuid().safeParse(workspaceId);
  if (!id.success) {
    return null;
  }

  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: id.data } },
    select: { role: true, workspace: { select: { slug: true, name: true } } },
  });
  if (!membership) {
    return null;
  }

  return {
    userId: user.id,
    workspaceId: id.data,
    role: membership.role,
    slug: membership.workspace.slug,
    name: membership.workspace.name,
  };
}

export async function loadActorAllowedTo(
  workspaceId: unknown,
  action: WorkspaceAction,
) {
  const actor = await loadActor(workspaceId);
  if (!actor || !can(actor.role, action)) {
    return null;
  }
  return actor;
}

export const requireMembership = cache(async (slug: string) => {
  const user = await requireUser();

  if (!hasNoNul(slug)) {
    notFound();
  }

  const membership = await db.membership.findFirst({
    where: { userId: user.id, workspace: { slug } },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { memberships: true } },
        },
      },
    },
  });
  if (!membership) {
    notFound();
  }

  const { workspace, role } = membership;
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    role,
    memberCount: workspace._count.memberships,
  } satisfies WorkspaceSummary;
});
