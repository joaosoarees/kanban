"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";
import { Button } from "@/components/ui/button";
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
        onClick={() => setOpen(true)}
        className={cn("h-10 px-4 enabled:hover:bg-brand-strong", className)}
      >
        <Plus aria-hidden />
        {label}
      </Button>
      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
