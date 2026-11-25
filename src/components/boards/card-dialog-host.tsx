"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CardDialog } from "@/components/boards/card-dialog";
import {
  pushCardUrl,
  readCardParam,
  replaceCardUrl,
} from "@/components/boards/card-url";
import type {
  BoardColumn,
  CardUpdate,
} from "@/features/boards/hooks/use-board-columns";
import { useBoardFilter } from "@/features/boards/hooks/use-board-filter";
import { isFilterActive } from "@/features/boards/lib/board-filter";
import { locateCard } from "@/lib/card-moves";

const CARD_NOT_FOUND =
  "Card não encontrado. Ele pode ter sido excluído ou estar em outro quadro.";
const CARD_DELETED = "Este card foi excluído. O quadro foi atualizado.";

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
  const [dirtyCardId, setDirtyCardId] = useState<string | null>(null);
  const heldId =
    dirtyCardId !== null && locateCard(columns, dirtyCardId)
      ? dirtyCardId
      : null;
  const cardId = heldId ?? requestedId;
  const location = cardId === null ? null : locateCard(columns, cardId);
  const shownId = useRef<string | null>(null);
  const isMissing = cardId !== null && location === null;
  const deletedCard = useRef<{
    id: string;
    columnId: string;
    index: number;
  } | null>(null);

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

  useEffect(() => {
    if (cardId === null) {
      shownId.current = null;
      return;
    }
    if (!isMissing) {
      shownId.current = cardId;
      return;
    }
    toast.error(shownId.current === cardId ? CARD_DELETED : CARD_NOT_FOUND);
    shownId.current = null;
    replaceCardUrl(null);
  }, [cardId, isMissing]);

  if (cardId === null || location === null) {
    return null;
  }

  return (
    <CardDialog
      key={cardId}
      workspaceId={workspaceId}
      boardId={boardId}
      card={location.card}
      column={location.column}
      index={location.index}
      columns={columns}
      canReorder={canReorder}
      isLeaving={heldId !== null && requestedId !== heldId}
      onDirtyChange={(isDirty) => {
        setDirtyCardId(isDirty ? cardId : null);
      }}
      onKeepEditing={() => {
        pushCardUrl(cardId);
      }}
      onDiscardLeaving={() => {
        setDirtyCardId(null);
      }}
      onDeleted={() => {
        deletedCard.current = {
          id: cardId,
          columnId: location.column.id,
          index: location.index,
        };
      }}
      onClose={() => {
        setDirtyCardId(null);
        shownId.current = null;
        pushCardUrl(null);
      }}
      onMoveCard={onMoveCard}
      onUpdateCard={onUpdateCard}
    />
  );
}
