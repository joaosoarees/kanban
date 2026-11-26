"use client";

import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import {
  acceptInviteAction,
  continueWithInviteAction,
} from "@/features/members/server/invite-actions";
import { runAction } from "@/lib/run-action";
import { cn } from "@/lib/utils";

const INVITE_FAILED = "Não foi possível continuar. Tente de novo.";

type InviteButtonProps = {
  token: string;
  onGone: () => void;
  intent: "accept" | "sign-in" | "sign-up";
  variant?: "default" | "outline";
  pendingLabel: string;
  children: ReactNode;
};

export function InviteButton({
  token,
  onGone,
  intent,
  variant = "default",
  pendingLabel,
  children,
}: InviteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      const result = await runAction(
        async () =>
          intent === "accept"
            ? acceptInviteAction(token)
            : continueWithInviteAction(token, intent),
        INVITE_FAILED,
      );
      if (result.status !== "error") {
        return;
      }
      if (result.gone === true) {
        onGone();
        return;
      }
      toast.error(result.message);
    });
  };

  return (
    <PendingButton
      type="button"
      variant={variant}
      isPending={isPending}
      pendingLabel={pendingLabel}
      onClick={run}
      className={cn(
        "h-10 w-full",
        variant === "default"
          ? primaryButton
          : "enabled:hover:bg-muted enabled:hover:text-foreground",
      )}
    >
      {children}
    </PendingButton>
  );
}
