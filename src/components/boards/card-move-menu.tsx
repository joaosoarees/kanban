"use client";

import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import type { BoardColumn } from "@/components/boards/use-board-columns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEM = "h-11 cursor-pointer gap-2.5 px-2";

type CardMoveMenuProps = {
  cardId: string;
  column: BoardColumn;
  index: number;
  columns: BoardColumn[];
  canReorder: boolean;
  onMove: (cardId: string, columnId: string, index: number) => void;
};

export function CardMoveMenu({
  cardId,
  column,
  index,
  columns,
  canReorder,
  onMove,
}: CardMoveMenuProps) {
  const otherColumns = columns.filter(({ id }) => id !== column.id);

  if (!canReorder && otherColumns.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-11 px-3.5 sm:hidden sm:pointer-coarse:inline-flex"
          />
        }
      >
        Mover para
        <ChevronDown aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[252px] p-1">
        {canReorder && (
          <>
            <DropdownMenuItem
              className={ITEM}
              disabled={index === 0}
              onClick={() => {
                onMove(cardId, column.id, index - 1);
              }}
            >
              <ArrowUp aria-hidden className="text-zinc-600" />
              Mover para cima
            </DropdownMenuItem>
            <DropdownMenuItem
              className={ITEM}
              disabled={index === column.cards.length - 1}
              onClick={() => {
                onMove(cardId, column.id, index + 1);
              }}
            >
              <ArrowDown aria-hidden className="text-zinc-600" />
              Mover para baixo
            </DropdownMenuItem>
          </>
        )}
        {otherColumns.length > 0 && (
          <>
            {canReorder && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[13px] font-medium text-zinc-600">
                Para o fim da coluna
              </DropdownMenuLabel>
              {otherColumns.map((other) => (
                <DropdownMenuItem
                  key={other.id}
                  className={ITEM}
                  onClick={() => {
                    onMove(cardId, other.id, other.cards.length);
                  }}
                >
                  <span className="truncate">{other.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
