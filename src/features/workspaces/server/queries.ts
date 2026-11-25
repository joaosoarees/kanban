import "server-only";
import { cache } from "react";
import type { Role } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

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
