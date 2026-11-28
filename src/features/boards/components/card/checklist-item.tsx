"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { CheckBox } from "@/components/check-box";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChecklistEntry } from "@/features/boards/lib/checklist-list";
import { cn } from "@/lib/utils";

const ICON_BUTTON =
  "flex size-11 shrink-0 items-center justify-center rounded-md outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50 sm:size-8";

const MENU_ITEM = "h-11 gap-2 px-2 text-sm sm:h-8";

type ChecklistItemProps = {
  item: ChecklistEntry;
  index: number;
  count: number;
  editor: ReactNode;
  disabled: boolean;
  textButtonRef: (node: HTMLButtonElement | null) => void;
  wasDragged: () => boolean;
  onToggle: (completed: boolean) => void;
  onEdit: () => void;
  onRemove: () => void;
  onMove: (index: number) => void;
};

export function ChecklistItem({
  item,
  index,
  count,
  editor,
  disabled,
  textButtonRef,
  wasDragged,
  onToggle,
  onEdit,
  onRemove,
  onMove,
}: ChecklistItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pointerType = useRef("");
  const {
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: disabled || editor !== null });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-start gap-0.5 rounded-lg pr-0.5 transition-colors duration-150 hover:bg-muted motion-reduce:transition-none sm:gap-1",
        isDragging &&
          "relative z-10 -rotate-1 bg-card shadow-lg ring-1 ring-border hover:bg-card",
      )}
    >
      <DropdownMenu
        open={isMenuOpen}
        onOpenChange={(open, details) => {
          if (open && details.event.type === "mousedown") {
            return;
          }
          setIsMenuOpen(open);
        }}
      >
        <DropdownMenuTrigger
          ref={setActivatorNodeRef}
          disabled={disabled || editor !== null}
          aria-label={`Mover o item ${item.text}`}
          onPointerDown={(event) => {
            pointerType.current = event.pointerType;
            if (event.pointerType !== "touch") {
              listeners?.onPointerDown(event);
            }
          }}
          onClick={() => {
            const isPointer =
              pointerType.current !== "" && pointerType.current !== "touch";
            if (isPointer && !wasDragged()) {
              setIsMenuOpen(true);
            }
            pointerType.current = "";
          }}
          className={cn(
            ICON_BUTTON,
            "w-8 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:cursor-default disabled:opacity-40 sm:w-5",
          )}
        >
          <GripVertical aria-hidden className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px] p-1">
          <DropdownMenuItem
            className={MENU_ITEM}
            disabled={index === 0}
            onClick={() => {
              onMove(index - 1);
            }}
          >
            <ArrowUp aria-hidden className="text-fg-muted" />
            Mover para cima
          </DropdownMenuItem>
          <DropdownMenuItem
            className={MENU_ITEM}
            disabled={index === count - 1}
            onClick={() => {
              onMove(index + 1);
            }}
          >
            <ArrowDown aria-hidden className="text-fg-muted" />
            Mover para baixo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <label
        className={cn(
          ICON_BUTTON,
          "cursor-pointer has-disabled:cursor-default has-disabled:opacity-40 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        )}
      >
        <input
          type="checkbox"
          checked={item.completed}
          disabled={disabled}
          onChange={(event) => {
            onToggle(event.target.checked);
          }}
          aria-label={`Concluir: ${item.text}`}
          className="sr-only"
        />
        <span className="transition-transform duration-140 active:scale-90 motion-reduce:transition-none">
          <CheckBox checked={item.completed} />
        </span>
      </label>

      {editor ?? (
        <>
          <button
            ref={textButtonRef}
            type="button"
            disabled={disabled}
            onClick={onEdit}
            aria-label={`Editar o item ${item.text}`}
            className={cn(
              "min-h-11 min-w-0 flex-1 cursor-text rounded-sm py-3 text-left text-[15px]/5 wrap-anywhere outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-8 sm:py-1.5 sm:text-sm/5",
              item.completed && "text-fg-muted line-through",
            )}
          >
            {item.text}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            aria-label={`Excluir o item ${item.text}`}
            className={cn(
              ICON_BUTTON,
              "text-muted-foreground hover:bg-muted-strong hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            <X aria-hidden className="size-4" />
          </button>
        </>
      )}
    </li>
  );
}
