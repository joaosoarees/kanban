import "server-only";
import { inviteMail } from "@/features/members/emails/invite";
import { newInviteToken } from "@/features/members/server/invite-token";
import {
  expiredInviteCutoff,
  inviteExpiresAt,
  isInviteExpired,
  MAX_DAILY_INVITE_SENDS,
  MAX_PENDING_INVITES,
  secondsUntilInviteResend,
  sendWindowStart,
} from "@/features/members/lib/invites";
import { recheckActor } from "@/features/workspaces/server/access";
import type { Prisma, Role } from "@/generated/prisma/client";
import type { ActionError } from "@/lib/action-result";
import { appUrl } from "@/server/app-url";
import { db } from "@/server/db";
import { sendMail } from "@/server/mail/send";

type Actor = { userId: string; workspaceId: string };

type InviteDelivery = {
  to: string;
  token: string;
  inviterName: string;
  workspaceName: string;
};

export type InviteSent = { email: string; delivered: boolean };

const PENDING_INVITE_GONE: ActionError = {
  status: "error",
  message: "Esse convite não existe mais.",
};

function fieldError(message: string): ActionError {
  return { status: "error", message, fieldErrors: { email: [message] } };
}

function waitError(waitSeconds: number): ActionError {
  return {
    status: "error",
    message: `Espere ${waitSeconds} s para enviar esse convite de novo.`,
  };
}

async function deliver(delivery: InviteDelivery): Promise<boolean> {
  try {
    return await sendMail(
      await inviteMail({
        to: delivery.to,
        inviterName: delivery.inviterName,
        workspaceName: delivery.workspaceName,
        link: appUrl(`/invite#${delivery.token}`),
      }),
    );
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function claimDailySend(
  tx: Prisma.TransactionClient,
  inviterId: string,
  now: Date,
): Promise<{ inviterName: string } | ActionError> {
  const rows = await tx.$queryRaw<{ name: string }[]>`
    SELECT name FROM users WHERE id = ${inviterId}::uuid FOR NO KEY UPDATE
  `;
  const inviter = rows.at(0);
  if (inviter === undefined) {
    throw new Error("The inviter must exist while holding a membership.");
  }

  const windowStart = sendWindowStart(now);
  await tx.inviteSend.deleteMany({
    where: { invitedById: inviterId, sentAt: { lt: windowStart } },
  });
  const sent = await tx.inviteSend.count({
    where: { invitedById: inviterId, sentAt: { gte: windowStart } },
  });
  if (sent >= MAX_DAILY_INVITE_SENDS) {
    return {
      status: "error",
      message: `Você chegou ao limite de ${MAX_DAILY_INVITE_SENDS} convites em 24 horas. Tente de novo mais tarde.`,
    };
  }

  await tx.inviteSend.create({
    data: { invitedById: inviterId, sentAt: now },
  });
  return { inviterName: inviter.name };
}

async function pendingCapReached(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  now: Date,
): Promise<ActionError | null> {
  const pending = await tx.invite.count({
    where: { workspaceId, expiresAt: { gt: now } },
  });
  if (pending < MAX_PENDING_INVITES) {
    return null;
  }
  return fieldError(
    `O workspace já tem ${MAX_PENDING_INVITES} convites pendentes. Revogue algum antes de convidar mais.`,
  );
}

async function workspaceName(
  tx: Prisma.TransactionClient,
  workspaceId: string,
) {
  const workspace = await tx.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { name: true },
  });
  return workspace.name;
}

export async function inviteMember(
  actor: Actor,
  input: { email: string; role: Role },
  now: Date,
): Promise<InviteSent | ActionError> {
  const { email, role } = input;
  appUrl("/");
  const result = await db.$transaction(async (tx) => {
    const denied = await recheckActor(tx, actor, "inviteMember");
    if (denied) {
      return denied;
    }

    await tx.invite.deleteMany({
      where: {
        workspaceId: actor.workspaceId,
        expiresAt: { lt: expiredInviteCutoff(now) },
      },
    });

    const member = await tx.membership.findFirst({
      where: { workspaceId: actor.workspaceId, user: { email } },
      select: { userId: true },
    });
    if (member) {
      return fieldError("Esta pessoa já faz parte do workspace.");
    }

    const current = await tx.invite.findUnique({
      where: { workspaceId_email: { workspaceId: actor.workspaceId, email } },
      select: { sentAt: true, expiresAt: true },
    });
    if (current) {
      const waitSeconds = secondsUntilInviteResend(current.sentAt, now);
      if (waitSeconds > 0) {
        return waitError(waitSeconds);
      }
    }
    if (current === null || isInviteExpired(current.expiresAt, now)) {
      const capped = await pendingCapReached(tx, actor.workspaceId, now);
      if (capped) {
        return capped;
      }
    }

    const claimed = await claimDailySend(tx, actor.userId, now);
    if ("status" in claimed) {
      return claimed;
    }

    const { token, tokenHash } = newInviteToken();
    const fields = {
      role,
      invitedById: actor.userId,
      tokenHash,
      sentAt: now,
      expiresAt: inviteExpiresAt(now),
    };
    await tx.invite.upsert({
      where: { workspaceId_email: { workspaceId: actor.workspaceId, email } },
      create: { workspaceId: actor.workspaceId, email, ...fields },
      update: fields,
    });
    return {
      to: email,
      token,
      inviterName: claimed.inviterName,
      workspaceName: await workspaceName(tx, actor.workspaceId),
    } satisfies InviteDelivery;
  });

  if ("status" in result) {
    return result;
  }
  return { email, delivered: await deliver(result) };
}

export async function resendInvite(
  actor: Actor,
  inviteId: string,
  now: Date,
): Promise<InviteSent | ActionError> {
  appUrl("/");
  const result = await db.$transaction(async (tx) => {
    const denied = await recheckActor(tx, actor, "inviteMember");
    if (denied) {
      return denied;
    }

    const invite = await tx.invite.findUnique({
      where: { id: inviteId, workspaceId: actor.workspaceId },
      select: { email: true, sentAt: true, expiresAt: true },
    });
    if (!invite) {
      return PENDING_INVITE_GONE;
    }
    const waitSeconds = secondsUntilInviteResend(invite.sentAt, now);
    if (waitSeconds > 0) {
      return waitError(waitSeconds);
    }
    if (isInviteExpired(invite.expiresAt, now)) {
      const capped = await pendingCapReached(tx, actor.workspaceId, now);
      if (capped) {
        return capped;
      }
    }

    const claimed = await claimDailySend(tx, actor.userId, now);
    if ("status" in claimed) {
      return claimed;
    }

    const { token, tokenHash } = newInviteToken();
    await tx.invite.update({
      where: { id: inviteId },
      data: {
        invitedById: actor.userId,
        tokenHash,
        sentAt: now,
        expiresAt: inviteExpiresAt(now),
      },
    });
    return {
      to: invite.email,
      token,
      inviterName: claimed.inviterName,
      workspaceName: await workspaceName(tx, actor.workspaceId),
    } satisfies InviteDelivery;
  });

  if ("status" in result) {
    return result;
  }
  return { email: result.to, delivered: await deliver(result) };
}

export async function revokeInvite(
  actor: Actor,
  inviteId: string,
): Promise<ActionError | null> {
  return db.$transaction(async (tx) => {
    const denied = await recheckActor(tx, actor, "inviteMember");
    if (denied) {
      return denied;
    }
    await tx.invite.deleteMany({
      where: { id: inviteId, workspaceId: actor.workspaceId },
    });
    return null;
  });
}
