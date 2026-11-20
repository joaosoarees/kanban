"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { leaveWorkspaceAction } from "@/app/(app)/w/[slug]/settings/actions";
import { dangerOutlineButton } from "@/components/button-styles";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LeaveWorkspaceProps = {
  workspaceId: string;
  workspaceName: string;
};

export function LeaveWorkspace({
  workspaceId,
  workspaceName,
}: LeaveWorkspaceProps) {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-labelledby="leave-title"
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="leave-title" className="text-[15px] font-semibold">
          Sair do workspace
        </h2>
        <p className="text-sm text-muted-foreground">
          Você perde o acesso aos quadros deste workspace.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => {
          setOpen(true);
        }}
        className={cn("h-10 px-4", dangerOutlineButton)}
      >
        <LogOut aria-hidden />
        Sair do workspace
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Sair de ${workspaceName}?`}
        description={
          "Você perde o acesso aos quadros deste workspace. Para voltar, um admin precisa adicionar você de\u00A0novo."
        }
        confirmLabel="Sair do workspace"
        pendingLabel="Saindo…"
        onConfirm={async () => leaveWorkspaceAction(workspaceId)}
      />
    </section>
  );
}
