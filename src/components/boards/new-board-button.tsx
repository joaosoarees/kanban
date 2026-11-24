"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { createBoardAction } from "@/app/(app)/w/[slug]/b/actions";
import { BoardNameDialog } from "@/components/boards/board-name-dialog";
import { primaryButton } from "@/components/button-styles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BUTTON_VARIANT = {
  primary: "default",
  outline: "outline",
  icon: "ghost",
} as const;

type NewBoardButtonProps = {
  workspaceId: string;
  boardsHref: string;
  label: string;
  appearance?: "primary" | "outline" | "icon";
  className?: string;
};

export function NewBoardButton({
  workspaceId,
  boardsHref,
  label,
  appearance = "primary",
  className,
}: NewBoardButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={BUTTON_VARIANT[appearance]}
        size={appearance === "icon" ? "icon-sm" : "default"}
        aria-label={appearance === "icon" ? label : undefined}
        onClick={() => {
          setOpen(true);
        }}
        className={cn(
          appearance === "primary" && ["px-3.5", primaryButton],
          appearance === "outline" && "px-3",
          appearance === "icon" && "text-fg-muted",
          className,
        )}
      >
        <Plus aria-hidden />
        {appearance !== "icon" && label}
      </Button>
      <BoardNameDialog
        open={open}
        onOpenChange={setOpen}
        title="Novo quadro"
        description="Ele começa com as colunas A fazer, Fazendo e Feito."
        defaultName=""
        submitLabel="Criar quadro"
        pendingLabel="Criando quadro…"
        boardsHref={boardsHref}
        submit={async (values) => createBoardAction(workspaceId, values)}
      />
    </>
  );
}
