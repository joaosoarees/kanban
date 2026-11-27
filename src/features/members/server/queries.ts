import "server-only";
import { connection } from "next/server";
import {
  inviteDueLabel,
  isInviteExpired,
} from "@/features/members/lib/invites";
import {
  compareAssignableMembers,
  compareMembers,
} from "@/features/members/lib/member-order";
import type { Role } from "@/generated/prisma/client";
import { db } from "@/server/db";

export type WorkspaceMember = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  assignedCards: number;
};

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
    .toSorted(compareMembers);
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
    .toSorted(compareAssignableMembers);
}

export type PendingInvite = {
  id: string;
  email: string;
  role: Role;
  inviterId: string;
  inviterName: string;
  due: string;
  isExpired: boolean;
};

export async function getPendingInvites(
  workspaceId: string,
): Promise<PendingInvite[]> {
  await connection();
  const invites = await db.invite.findMany({
    where: { workspaceId },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      invitedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ sentAt: "desc" }, { id: "desc" }],
  });
  const now = new Date();
  return invites.map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    inviterId: invite.invitedBy.id,
    inviterName: invite.invitedBy.name,
    due: inviteDueLabel(invite.expiresAt, now),
    isExpired: isInviteExpired(invite.expiresAt, now),
  }));
}
