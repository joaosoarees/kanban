"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CardDialogBody } from "@/features/boards/components/card/card-dialog-body";
import type {
  BoardColumn,
  CardUpdate,
} from "@/features/boards/hooks/use-board-columns";
import { useCardComments } from "@/features/boards/hooks/use-card-comments";
import { useCardDescription } from "@/features/boards/hooks/use-card-description";
import { useCommentForms } from "@/features/boards/hooks/use-comment-forms";
import { locateCard } from "@/features/boards/lib/card-moves";
import { pushCardUrl, replaceCardUrl } from "@/features/boards/lib/card-url";
import type { ActionResult } from "@/lib/action-result";

const DISCARDED: ActionResult = { status: "success", data: undefined };
const CARD_NOT_FOUND =
  "Card não encontrado. Ele pode ter sido excluído ou estar em outro quadro.";
const CARD_DELETED = "Este card foi excluído. O quadro foi atualizado.";

export type DeletedCard = { id: string; columnId: string; index: number };

type CardDialogProps = {
  workspaceId: string;
  boardId: string;
  requestedId: string | null;
  columns: BoardColumn[];
  canReorder: boolean;
  onDeleted: (card: DeletedCard) => void;
  onMoveCard: (cardId: string, columnId: string, index: number) => void;
  onUpdateCard: (update: CardUpdate) => void;
};

export function CardDialog({
  workspaceId,
  boardId,
  requestedId,
  columns,
  canReorder,
  onDeleted,
  onMoveCard,
  onUpdateCard,
}: CardDialogProps) {
  const router = useRouter();
  const [shownId, setShownId] = useState(requestedId);
  const [discardingId, setDiscardingId] = useState<string | null>(null);
  const displayedId = useRef<string | null>(null);
  const location = shownId === null ? null : locateCard(columns, shownId);
  const cardId = location === null ? null : shownId;
  const isMissing = shownId !== null && location === null;
  const isDiscarding = discardingId !== null && discardingId === cardId;

  const close = () => {
    displayedId.current = null;
    pushCardUrl(null);
  };

  const description = useCardDescription({
    workspaceId,
    boardId,
    cardId,
    onLoadFailed: (message, isGone) => {
      toast.error(message);
      close();
      if (isGone) {
        router.refresh();
      }
    },
  });
  const comments = useCardComments(workspaceId, boardId, cardId);
  const commentForms = useCommentForms({
    workspaceId,
    boardId,
    cardId,
    comments,
  });

  const isDirty = description.isDirty || commentForms.unsaved !== null;
  const isLeaving = cardId !== null && requestedId !== cardId && isDirty;

  if (requestedId !== shownId && !isLeaving) {
    setShownId(requestedId);
  }

  useEffect(() => {
    if (shownId === null) {
      displayedId.current = null;
      return;
    }
    if (!isMissing) {
      displayedId.current = shownId;
      return;
    }
    toast.error(
      displayedId.current === shownId ? CARD_DELETED : CARD_NOT_FOUND,
    );
    displayedId.current = null;
    replaceCardUrl(null);
  }, [shownId, isMissing]);

  if (location === null) {
    return null;
  }

  const { card, column, index } = location;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (open || description.isSaving || commentForms.isBusy) {
          return;
        }
        if (isDirty) {
          setDiscardingId(cardId);
          return;
        }
        close();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-3 flex max-h-[calc(100svh-1.5rem)] translate-y-0 flex-col gap-4 overflow-y-auto p-5 sm:top-[88px] sm:max-h-[calc(100svh-7rem)] sm:max-w-[600px] lg:max-w-[960px] lg:gap-0 lg:overflow-hidden lg:p-0"
      >
        <CardDialogBody
          key={card.id}
          workspaceId={workspaceId}
          boardId={boardId}
          card={card}
          column={column}
          index={index}
          columns={columns}
          canReorder={canReorder}
          description={description}
          comments={comments}
          commentForms={commentForms}
          onDeleted={() => {
            description.cancel();
            commentForms.discard();
            onDeleted({ id: card.id, columnId: column.id, index });
            close();
          }}
          onMoveCard={onMoveCard}
          onUpdateCard={onUpdateCard}
        />

        <ConfirmDialog
          open={isDiscarding || isLeaving}
          onOpenChange={(open) => {
            if (open) {
              return;
            }
            setDiscardingId(null);
            if (isLeaving) {
              pushCardUrl(card.id);
            }
          }}
          title="Descartar as alterações?"
          description={
            description.isDirty
              ? "A descrição editada ainda não foi salva e será perdida."
              : commentForms.unsaved === "both"
                ? "Há comentários escritos ou editados que ainda não foram salvos e serão perdidos."
                : commentForms.unsaved === "edit"
                  ? "A edição do comentário ainda não foi salva e será perdida."
                  : "O comentário escrito ainda não foi enviado e será perdido."
          }
          confirmLabel="Descartar"
          pendingLabel="Descartando…"
          cancelLabel="Continuar editando"
          onConfirm={() => {
            setDiscardingId(null);
            description.cancel();
            commentForms.discard();
            if (!isLeaving) {
              close();
            }
            return DISCARDED;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
