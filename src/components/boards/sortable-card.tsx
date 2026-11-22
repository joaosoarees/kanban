"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PointerEvent } from "react";
import { BoardCardButton } from "@/components/boards/board-card";
import { pushCardUrl } from "@/components/boards/card-url";
import type { BoardCard } from "@/components/boards/use-board-columns";
import { cn } from "@/lib/utils";

type SortableCardProps = {
  card: BoardCard;
  columnId: string;
  isDropDisabled: boolean;
};

export function SortableCard({
  card,
  columnId,
  isDropDisabled,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", columnId },
    disabled: { droppable: isDropDisabled },
  });

  return (
    <BoardCardButton
      ref={setNodeRef}
      card={card}
      data-card-focus={card.id}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "motion-reduce:transition-none!",
        isDragging &&
          "border-2 border-dashed border-brand bg-indigo-50 shadow-none *:invisible",
      )}
      {...attributes}
      {...listeners}
      aria-roledescription="card arrastável"
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        if (event.pointerType !== "touch") {
          listeners?.onPointerDown(event);
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " ") {
          event.preventDefault();
        }
      }}
      onClick={() => {
        pushCardUrl(card.id);
      }}
    />
  );
}
