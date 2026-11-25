"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { primaryButton } from "@/components/button-styles";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";
import { cn } from "@/lib/utils";

type NewWorkspaceButtonProps = {
  label?: string;
  className?: string;
};

export function NewWorkspaceButton({
  label = "Novo workspace",
  className,
}: NewWorkspaceButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
        className={cn("h-10 px-4", primaryButton, className)}
      >
        <Plus aria-hidden />
        {label}
      </Button>
      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
