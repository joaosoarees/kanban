import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Role } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  role: Role;
  memberCount: number;
};

export const getMyWorkspaces = cache(async (): Promise<WorkspaceSummary[]> => {
  const user = await requireUser();

  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    orderBy: { workspace: { name: "asc" } },
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

  return memberships.map(({ role, workspace }) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    role,
    memberCount: workspace._count.memberships,
  }));
});

export type WorkspaceMember = {
  userId: string;
  name: string;
  email: string;
  role: Role;
};

const ROLE_ORDER: Record<Role, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2 };

export async function getMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const memberships = await db.membership.findMany({
    where: { workspaceId },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return memberships
    .map(({ role, user }) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      role,
    }))
    .toSorted(
      (a, b) =>
        ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
        a.name.localeCompare(b.name, "pt-BR"),
    );
}

export const requireMembership = cache(async (slug: string) => {
  const user = await requireUser();

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
