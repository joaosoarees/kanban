"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PointerEvent } from "react";
import { BoardCardButton } from "@/features/boards/components/card/board-card";
import type { BoardCard } from "@/features/boards/hooks/use-board-columns";
import { pushCardUrl } from "@/features/boards/lib/card-url";
import { cn } from "@/lib/utils";

type SortableCardProps = {
  card: BoardCard;
  columnId: string;
  isDragDisabled: boolean;
  isDropDisabled: boolean;
};

export function SortableCard({
  card,
  columnId,
  isDragDisabled,
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
    disabled: { draggable: isDragDisabled, droppable: isDropDisabled },
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
          "border-2 border-dashed border-brand-fg bg-accent shadow-none *:invisible",
      )}
      {...(isDragDisabled
        ? {}
        : {
            ...attributes,
            ...listeners,
            "aria-roledescription": "card arrastável",
          })}
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
