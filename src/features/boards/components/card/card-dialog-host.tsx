"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  CardDialog,
  type DeletedCard,
} from "@/features/boards/components/card/card-dialog";
import type {
  BoardColumn,
  CardUpdate,
} from "@/features/boards/hooks/use-board-columns";
import { useBoardFilter } from "@/features/boards/hooks/use-board-filter";
import { isFilterActive } from "@/features/boards/lib/board-filter";
import { locateCard } from "@/features/boards/lib/card-moves";
import { readCardParam } from "@/features/boards/lib/card-url";

type CardDialogHostProps = {
  workspaceId: string;
  boardId: string;
  columns: BoardColumn[];
  onMoveCard: (cardId: string, columnId: string, index: number) => void;
  onUpdateCard: (update: CardUpdate) => void;
};

function focusTargetOf(id: string) {
  return document.querySelector<HTMLElement>(`[data-card-focus="${id}"]`);
}

export function CardDialogHost({
  workspaceId,
  boardId,
  columns,
  onMoveCard,
  onUpdateCard,
}: CardDialogHostProps) {
  const requestedId = readCardParam(useSearchParams());
  const canReorder = !isFilterActive(useBoardFilter());
  const deletedCard = useRef<DeletedCard | null>(null);

  useEffect(() => {
    const deleted = deletedCard.current;
    if (deleted === null || locateCard(columns, deleted.id)) {
      return;
    }
    deletedCard.current = null;
    const cards =
      columns.find(({ id }) => id === deleted.columnId)?.cards ?? [];
    const neighbors = [
      ...cards.slice(deleted.index),
      ...cards.slice(0, deleted.index).toReversed(),
    ];
    const neighbor = neighbors
      .map(({ id }) => focusTargetOf(id))
      .find((element) => element !== null);
    (neighbor ?? focusTargetOf(deleted.columnId))?.focus();
  }, [columns]);

  return (
    <CardDialog
      workspaceId={workspaceId}
      boardId={boardId}
      requestedId={requestedId}
      columns={columns}
      canReorder={canReorder}
      onDeleted={(card) => {
        deletedCard.current = card;
      }}
      onMoveCard={onMoveCard}
      onUpdateCard={onUpdateCard}
    />
  );
}
