import "server-only";
import {
  INVITE_GONE_MESSAGE,
  isInviteExpired,
} from "@/features/members/lib/invites";
import { inviteTokenSchema } from "@/features/members/lib/schemas";
import { hashInviteToken } from "@/features/members/server/invite-token";
import { recheckActor } from "@/features/workspaces/server/access";
import type { Role } from "@/generated/prisma/enums";
import type { ActionError } from "@/lib/action-result";
import { db } from "@/server/db";
import { getRememberedInvite } from "@/server/session";

export const INVITE_GONE: ActionError = {
  status: "error",
  message: INVITE_GONE_MESSAGE,
  gone: true,
};

export type InvitePreview = {
  email: string;
  role: Role;
  workspaceName: string;
  workspaceSlug: string;
  inviterName: string;
  expiresAt: Date;
};

export async function loadInvite(
  token: string,
  now: Date,
): Promise<InvitePreview | null> {
  const invite = await db.invite.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      workspace: { select: { name: true, slug: true } },
      invitedBy: { select: { name: true } },
    },
  });
  if (!invite || isInviteExpired(invite.expiresAt, now)) {
    return null;
  }
  return {
    email: invite.email,
    role: invite.role,
    workspaceName: invite.workspace.name,
    workspaceSlug: invite.workspace.slug,
    inviterName: invite.invitedBy.name,
    expiresAt: invite.expiresAt,
  };
}

export async function previewInvite(
  token: unknown,
): Promise<InvitePreview | null> {
  const parsed = inviteTokenSchema.safeParse(token);
  return parsed.success ? loadInvite(parsed.data, new Date()) : null;
}

export async function loadRememberedInvite(): Promise<InvitePreview | null> {
  return previewInvite(await getRememberedInvite());
}

export type Acceptance =
  | { status: "accepted"; slug: string }
  | { status: "other-email"; email: string }
  | { status: "gone" };

export async function acceptInvite(
  user: { id: string; email: string },
  token: string,
  now: Date,
): Promise<Acceptance> {
  return db.$transaction(async (tx) => {
    const invite = await tx.invite.findUnique({
      where: { tokenHash: hashInviteToken(token) },
      select: {
        id: true,
        workspaceId: true,
        email: true,
        role: true,
        invitedById: true,
        expiresAt: true,
      },
    });
    if (!invite || isInviteExpired(invite.expiresAt, now)) {
      return { status: "gone" };
    }
    if (invite.email !== user.email) {
      return { status: "other-email", email: invite.email };
    }

    const denied = await recheckActor(
      tx,
      { userId: invite.invitedById, workspaceId: invite.workspaceId },
      "inviteMember",
    );
    const deleted = await tx.invite.deleteMany({
      where: { id: invite.id, tokenHash: hashInviteToken(token) },
    });
    if (denied || deleted.count === 0) {
      return { status: "gone" };
    }

    await tx.membership.createMany({
      data: {
        userId: user.id,
        workspaceId: invite.workspaceId,
        role: invite.role,
        createdAt: now,
      },
      skipDuplicates: true,
    });
    const workspace = await tx.workspace.findUniqueOrThrow({
      where: { id: invite.workspaceId },
      select: { slug: true },
    });
    return { status: "accepted", slug: workspace.slug };
  });
}
