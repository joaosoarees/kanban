"use client";

import {
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  FoldHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEM = "h-11 cursor-pointer gap-2.5 px-2 sm:h-10";

type ColumnMenuProps = {
  name: string;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onRename: () => void;
  onCollapse: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDelete: () => void;
};

export function ColumnMenu({
  name,
  canMoveLeft,
  canMoveRight,
  onRename,
  onCollapse,
  onMoveLeft,
  onMoveRight,
  onDelete,
}: ColumnMenuProps) {
  const keepFocusOnTrigger = useRef(true);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          keepFocusOnTrigger.current = true;
        }
      }}
    >
      <DropdownMenuTrigger
        aria-label={`Opções da coluna ${name}`}
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 text-fg-muted hover:bg-muted-strong data-popup-open:bg-muted-strong sm:size-8"
          />
        }
      >
        <Ellipsis aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        finalFocus={() => keepFocusOnTrigger.current}
        className="w-[232px] p-1.5"
      >
        <DropdownMenuItem
          className={ITEM}
          onClick={() => {
            keepFocusOnTrigger.current = false;
            onRename();
          }}
        >
          <Pencil aria-hidden className="text-fg-muted" />
          Renomear
        </DropdownMenuItem>
        <DropdownMenuItem
          className={ITEM}
          onClick={() => {
            keepFocusOnTrigger.current = false;
            onCollapse();
          }}
        >
          <FoldHorizontal aria-hidden className="text-fg-muted" />
          Recolher
        </DropdownMenuItem>
        <DropdownMenuItem
          className={ITEM}
          disabled={!canMoveLeft}
          onClick={onMoveLeft}
        >
          <ArrowLeft aria-hidden className="text-fg-muted" />
          Mover para a esquerda
        </DropdownMenuItem>
        <DropdownMenuItem
          className={ITEM}
          disabled={!canMoveRight}
          onClick={onMoveRight}
        >
          <ArrowRight aria-hidden className="text-fg-muted" />
          Mover para a direita
        </DropdownMenuItem>
        <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
        <DropdownMenuItem
          variant="destructive"
          className={ITEM}
          onClick={onDelete}
        >
          <Trash2 aria-hidden />
          Excluir coluna
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
