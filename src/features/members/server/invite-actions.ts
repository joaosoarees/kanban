"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  inviteIdSchema,
  inviteMemberSchema,
  inviteTokenSchema,
} from "@/features/members/lib/schemas";
import {
  acceptInvite,
  INVITE_GONE,
  loadInvite,
} from "@/features/members/server/invite-acceptance";
import {
  type InviteSent,
  inviteMember,
  resendInvite,
  revokeInvite,
} from "@/features/members/server/invites";
import {
  loadActorAllowedTo,
  revalidateWorkspace,
} from "@/features/workspaces/server/access";
import {
  type ActionError,
  type ActionResult,
  FORBIDDEN,
  INVALID,
  invalidFields,
} from "@/lib/action-result";
import {
  endSession,
  forgetInvite,
  getCurrentUser,
  rememberInvite,
} from "@/server/session";

export async function acceptInviteAction(
  token: unknown,
): Promise<ActionResult> {
  const parsed = inviteTokenSchema.safeParse(token);
  if (!parsed.success) {
    return INVITE_GONE;
  }

  const user = await getCurrentUser();
  if (!user) {
    return redirect(`/invite/${parsed.data}`);
  }

  const outcome = await acceptInvite(user, parsed.data, new Date());
  await forgetInvite();
  if (outcome.status === "gone") {
    return INVITE_GONE;
  }
  if (outcome.status === "other-email") {
    return {
      status: "error",
      message: `Este convite é para ${outcome.email}. Entre com essa conta para aceitar.`,
    };
  }
  revalidatePath("/", "layout");
  return redirect(`/w/${outcome.slug}`);
}

export async function continueWithInviteAction(
  token: unknown,
  next: "sign-in" | "sign-up",
): Promise<ActionResult> {
  const parsed = inviteTokenSchema.safeParse(token);
  if (!parsed.success) {
    return INVITE_GONE;
  }

  const invite = await loadInvite(parsed.data, new Date());
  if (!invite) {
    return INVITE_GONE;
  }

  await endSession();
  await rememberInvite(parsed.data, invite.expiresAt);
  return redirect(next === "sign-up" ? "/sign-up" : "/sign-in");
}

const INVITE_NOT_DELIVERED =
  "O convite foi salvo, mas não conseguimos enviar o e-mail. Use “Reenviar” em instantes.";

function inviteResult(
  sent: InviteSent | ActionError,
): ActionResult<{ email: string }> {
  if ("status" in sent) {
    return sent;
  }
  if (!sent.delivered) {
    return { status: "error", message: INVITE_NOT_DELIVERED };
  }
  return { status: "success", data: { email: sent.email } };
}

export async function inviteMemberAction(
  workspaceId: unknown,
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  const actor = await loadActorAllowedTo(workspaceId, "inviteMember");
  if (!actor) {
    return FORBIDDEN;
  }

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFields(parsed.error);
  }

  const sent = await inviteMember(actor, parsed.data, new Date());
  revalidateWorkspace(actor.slug);
  return inviteResult(sent);
}

export async function resendInviteAction(
  workspaceId: unknown,
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  const actor = await loadActorAllowedTo(workspaceId, "inviteMember");
  const parsed = inviteIdSchema.safeParse(input);
  if (!actor) {
    return FORBIDDEN;
  }
  if (!parsed.success) {
    return INVALID;
  }

  const sent = await resendInvite(actor, parsed.data.inviteId, new Date());
  revalidateWorkspace(actor.slug);
  return inviteResult(sent);
}

export async function revokeInviteAction(
  workspaceId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const actor = await loadActorAllowedTo(workspaceId, "inviteMember");
  const parsed = inviteIdSchema.safeParse(input);
  if (!actor) {
    return FORBIDDEN;
  }
  if (!parsed.success) {
    return INVALID;
  }

  const refused = await revokeInvite(actor, parsed.data.inviteId);
  revalidateWorkspace(actor.slug);
  return refused ?? { status: "success", data: undefined };
}
