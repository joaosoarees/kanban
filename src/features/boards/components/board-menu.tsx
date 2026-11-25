"use client";

import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteBoardAction,
  renameBoardAction,
} from "@/features/boards/actions";
import { BoardNameDialog } from "@/features/boards/components/board-name-dialog";

const ITEM = "h-11 cursor-pointer gap-2.5 px-2 sm:h-10";
const DESTRUCTIVE_ITEM = `${ITEM} data-[variant=destructive]:text-danger-text data-[variant=destructive]:focus:text-danger-text`;

type BoardMenuProps = {
  workspaceId: string;
  boardId: string;
  name: string;
  columnCount: number;
  boardsHref: string;
};

export function BoardMenu({
  workspaceId,
  boardId,
  name,
  columnCount,
  boardsHref,
}: BoardMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deletedText =
    columnCount === 0
      ? "O quadro será apagado"
      : columnCount === 1
        ? "O quadro e sua coluna serão apagados"
        : `O quadro e suas ${columnCount} colunas serão apagados`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Opções do quadro"
          render={
            <Button
              variant="outline"
              size="icon"
              className="size-11 shrink-0 bg-card text-fg-muted sm:size-8"
            />
          }
        >
          <Ellipsis aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 p-1.5">
          <DropdownMenuItem
            className={ITEM}
            onClick={() => {
              setIsRenaming(true);
            }}
          >
            <Pencil aria-hidden className="text-fg-muted" />
            Renomear quadro
          </DropdownMenuItem>
          <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
          <DropdownMenuItem
            variant="destructive"
            className={DESTRUCTIVE_ITEM}
            onClick={() => {
              setIsDeleting(true);
            }}
          >
            <Trash2 aria-hidden />
            Excluir quadro
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <BoardNameDialog
        open={isRenaming}
        onOpenChange={setIsRenaming}
        title="Renomear quadro"
        description="O novo nome aparece para todo o workspace."
        defaultName={name}
        submitLabel="Salvar"
        pendingLabel="Salvando…"
        boardsHref={boardsHref}
        submit={async (values) =>
          renameBoardAction(workspaceId, boardId, values)
        }
      />
      <ConfirmDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        title={`Excluir o quadro ${name}?`}
        description={`${deletedText} para todo o workspace. Isso não pode ser desfeito.`}
        confirmLabel="Excluir quadro"
        pendingLabel="Excluindo quadro…"
        onConfirm={async () => deleteBoardAction(workspaceId, boardId)}
      />
    </>
  );
}
