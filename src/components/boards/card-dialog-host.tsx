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
import type { BoardColumn } from "@/components/boards/use-board-columns";
import { locateCard } from "@/lib/card-moves";

const CARD_NOT_FOUND =
  "Card não encontrado. Ele pode ter sido excluído ou estar em outro quadro.";
const CARD_DELETED = "Este card foi excluído. O quadro foi atualizado.";

type CardDialogHostProps = {
  workspaceId: string;
  boardId: string;
  columns: BoardColumn[];
  onMoveCard: (cardId: string, columnId: string, index: number) => void;
};

export function CardDialogHost({
  workspaceId,
  boardId,
  columns,
  onMoveCard,
}: CardDialogHostProps) {
  const requestedId = readCardParam(useSearchParams());
  const [dirtyCardId, setDirtyCardId] = useState<string | null>(null);
  const heldId =
    dirtyCardId !== null && locateCard(columns, dirtyCardId)
      ? dirtyCardId
      : null;
  const cardId = heldId ?? requestedId;
  const location = cardId === null ? null : locateCard(columns, cardId);
  const shownId = useRef<string | null>(null);
  const isMissing = cardId !== null && location === null;

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
      onClose={() => {
        setDirtyCardId(null);
        shownId.current = null;
        pushCardUrl(null);
      }}
      onMoveCard={onMoveCard}
    />
  );
}
