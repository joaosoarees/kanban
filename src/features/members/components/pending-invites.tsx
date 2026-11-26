"use client";

import { Mail } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { rowButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import {
  resendInviteAction,
  revokeInviteAction,
} from "@/features/members/server/invite-actions";
import type { PendingInvite } from "@/features/members/server/queries";
import { RoleBadge } from "@/features/workspaces/components/role-badge";
import { runAction } from "@/lib/run-action";

const RESEND_FAILED = "Não foi possível reenviar o convite. Tente de novo.";
const REVOKE_FAILED = "O convite não foi revogado.";

type PendingInvitesProps = {
  workspaceId: string;
  invites: PendingInvite[];
  viewerId: string;
};

export function PendingInvites({
  workspaceId,
  invites,
  viewerId,
}: PendingInvitesProps) {
  const [visibleInvites, hideInvite] = useOptimistic(
    invites,
    (current, inviteId: string) => current.filter(({ id }) => id !== inviteId),
  );
  const [, startTransition] = useTransition();

  const revoke = (invite: PendingInvite) => {
    startTransition(async () => {
      hideInvite(invite.id);
      const result = await runAction(
        async () => revokeInviteAction(workspaceId, { inviteId: invite.id }),
        REVOKE_FAILED,
      );
      if (result.status === "error") {
        toast.error(`Não foi possível revogar o convite de ${invite.email}.`, {
          description: `${result.message} A lista voltou ao que era.`,
        });
      }
    });
  };

  if (visibleInvites.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="pending-invites-title"
      className="flex flex-col gap-3"
    >
      <h2
        id="pending-invites-title"
        className="flex items-center gap-2 text-[15px] font-semibold"
      >
        Convites pendentes
        <span className="rounded-full bg-muted px-1.5 text-xs font-normal text-muted-foreground">
          {visibleInvites.length}
        </span>
      </h2>
      <ul className="divide-y rounded-xl border bg-card">
        {visibleInvites.map((invite) => (
          <PendingInviteRow
            key={invite.id}
            workspaceId={workspaceId}
            invite={invite}
            sentByViewer={invite.inviterId === viewerId}
            onRevoke={() => {
              revoke(invite);
            }}
          />
        ))}
      </ul>
    </section>
  );
}

type PendingInviteRowProps = {
  workspaceId: string;
  invite: PendingInvite;
  sentByViewer: boolean;
  onRevoke: () => void;
};

function PendingInviteRow({
  workspaceId,
  invite,
  sentByViewer,
  onRevoke,
}: PendingInviteRowProps) {
  const [isResending, startResend] = useTransition();

  const resend = () => {
    startResend(async () => {
      const result = await runAction(
        async () => resendInviteAction(workspaceId, { inviteId: invite.id }),
        RESEND_FAILED,
      );
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      if (result.data.delivered) {
        toast.success(`Convite reenviado para ${invite.email}`);
        return;
      }
      toast.warning("O convite foi salvo, mas o e-mail não saiu.", {
        description: "Use “Reenviar” em instantes.",
      });
    });
  };

  const sentBy = sentByViewer ? "você" : invite.inviterName;

  return (
    <li className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border-control text-muted-foreground"
        >
          <Mail className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span title={invite.email} className="truncate text-sm font-semibold">
            {invite.email}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
            {invite.isExpired && (
              <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-danger-border bg-danger-bg px-1.5 text-xs font-medium text-danger-text">
                Vencido
              </span>
            )}
            <span className="truncate">
              {invite.due} · enviado por {sentBy}
            </span>
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pl-12 sm:justify-end sm:pl-0">
        <span className="inline-flex w-28">
          <RoleBadge role={invite.role} />
        </span>
        <div className="flex gap-2">
          <PendingButton
            variant="outline"
            isPending={isResending}
            pendingLabel={`Reenviando o convite de ${invite.email}`}
            onClick={resend}
            aria-label={`Reenviar o convite de ${invite.email}`}
            className="h-8 w-[92px] px-2.5 text-[13px] text-fg-secondary enabled:hover:bg-muted enabled:hover:text-foreground"
          >
            Reenviar
          </PendingButton>
          <Button
            variant="outline"
            onClick={onRevoke}
            aria-label={`Revogar o convite de ${invite.email}`}
            className={rowButton}
          >
            Revogar
          </Button>
        </div>
      </div>
    </li>
  );
}
