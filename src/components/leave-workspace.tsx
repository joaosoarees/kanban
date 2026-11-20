"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { leaveWorkspaceAction } from "@/app/(app)/w/[slug]/settings/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

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
        onClick={() => setOpen(true)}
        className="h-10 border-red-200 px-4 text-red-700 enabled:hover:bg-red-50 enabled:hover:text-red-800"
      >
        <LogOut aria-hidden />
        Sair do workspace
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Sair de ${workspaceName}?`}
        description="Você perde o acesso aos quadros deste workspace. Para voltar, um admin precisa adicionar você de novo."
        confirmLabel="Sair do workspace"
        pendingLabel="Saindo…"
        onConfirm={() => leaveWorkspaceAction(workspaceId)}
      />
    </section>
  );
}
