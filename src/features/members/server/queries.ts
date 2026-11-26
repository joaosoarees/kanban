import "server-only";
import type { Role } from "@/generated/prisma/client";
import { db } from "@/server/db";

export type WorkspaceMember = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  assignedCards: number;
};

const ROLE_ORDER: Record<Role, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2 };

export async function getMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const [memberships, assignments] = await Promise.all([
    db.membership.findMany({
      where: { workspaceId },
      select: {
        role: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.$queryRaw<{ assigneeId: string; total: number }[]>`
      SELECT card."assigneeId", count(*)::int AS total
      FROM cards card
      JOIN columns board_column ON board_column.id = card."columnId"
      JOIN boards board ON board.id = board_column."boardId"
      WHERE board."workspaceId" = ${workspaceId}::uuid
        AND card."assigneeId" IS NOT NULL
      GROUP BY card."assigneeId"
    `,
  ]);
  const assignedCards = new Map(
    assignments.map(({ assigneeId, total }) => [assigneeId, total]),
  );

  return memberships
    .map(({ role, user }) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      role,
      assignedCards: assignedCards.get(user.id) ?? 0,
    }))
    .toSorted(
      (a, b) =>
        ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
        a.name.localeCompare(b.name, "pt-BR") ||
        a.userId.localeCompare(b.userId),
    );
}

export async function getAssignableMembers(
  workspaceId: string,
  viewerId: string,
) {
  const memberships = await db.membership.findMany({
    where: { workspaceId },
    select: { user: { select: { id: true, name: true } } },
  });

  return memberships
    .map(({ user }) => ({
      id: user.id,
      name: user.name,
      isViewer: user.id === viewerId,
    }))
    .toSorted(
      (a, b) =>
        Number(b.isViewer) - Number(a.isViewer) ||
        a.name.localeCompare(b.name, "pt-BR") ||
        a.id.localeCompare(b.id),
    );
}

export type PendingInvite = {
  id: string;
  email: string;
  role: Role;
  sentAt: Date;
  expiresAt: Date;
};

export async function getPendingInvites(
  workspaceId: string,
): Promise<PendingInvite[]> {
  return db.invite.findMany({
    where: { workspaceId },
    select: {
      id: true,
      email: true,
      role: true,
      sentAt: true,
      expiresAt: true,
    },
    orderBy: [{ sentAt: "desc" }, { id: "desc" }],
  });
}
