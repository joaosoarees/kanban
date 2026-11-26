import { Mail } from "lucide-react";
import type { InvitePreview } from "@/features/members/server/invite-acceptance";
import { dismissInviteAction } from "@/features/members/server/invite-actions";

export function InviteNote({ invite }: { invite: InvitePreview }) {
  return (
    <aside
      aria-label="Convite"
      className="mb-6 flex items-start gap-2.5 rounded-[10px] border border-accent-border bg-accent px-3.5 py-3 text-sm/5 text-accent-foreground"
    >
      <Mail aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="flex min-w-0 flex-col items-start gap-1">
        <p className="wrap-anywhere">
          Convite de{" "}
          <strong className="font-semibold">{invite.inviterName}</strong> para{" "}
          <strong className="font-semibold">{invite.workspaceName}</strong>
        </p>
        <form action={dismissInviteAction}>
          <button
            type="submit"
            className="cursor-pointer rounded-sm text-[13px]/5 font-medium text-brand-fg underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Seguir sem o convite
          </button>
        </form>
      </div>
    </aside>
  );
}
