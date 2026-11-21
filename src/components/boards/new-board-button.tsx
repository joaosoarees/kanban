"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { createBoardAction } from "@/app/(app)/w/[slug]/b/actions";
import { BoardNameDialog } from "@/components/boards/board-name-dialog";
import { primaryButton } from "@/components/button-styles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NewBoardButtonProps = {
  workspaceId: string;
  boardsHref: string;
  label: string;
  className?: string;
};

export function NewBoardButton({
  workspaceId,
  boardsHref,
  label,
  className,
}: NewBoardButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
        className={cn("px-3.5", primaryButton, className)}
      >
        <Plus aria-hidden />
        {label}
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
