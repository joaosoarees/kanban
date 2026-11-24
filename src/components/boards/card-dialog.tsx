"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteCardAction } from "@/app/(app)/w/[slug]/b/card-actions";
import {
  CardDescription,
  CardDescriptionActions,
} from "@/components/boards/card-description";
import { CardMoveMenu } from "@/components/boards/card-move-menu";
import { CardProperties } from "@/components/boards/card-properties";
import { CardTitle } from "@/components/boards/card-title";
import type {
  BoardCard,
  BoardColumn,
  CardUpdate,
} from "@/components/boards/use-board-columns";
import { useCardDescription } from "@/components/boards/use-card-description";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/action-result";

const DISCARDED: ActionResult = { status: "success", data: undefined };

type CardDialogProps = {
  workspaceId: string;
  boardId: string;
  card: BoardCard;
  column: BoardColumn;
  index: number;
  columns: BoardColumn[];
  canReorder: boolean;
  isLeaving: boolean;
  onDirtyChange: (isDirty: boolean) => void;
  onKeepEditing: () => void;
  onDiscardLeaving: () => void;
  onDeleted: () => void;
  onClose: () => void;
  onMoveCard: (cardId: string, columnId: string, index: number) => void;
  onUpdateCard: (update: CardUpdate) => void;
};

export function CardDialog({
  workspaceId,
  boardId,
  card,
  column,
  index,
  columns,
  canReorder,
  isLeaving,
  onDirtyChange,
  onKeepEditing,
  onDiscardLeaving,
  onDeleted,
  onClose,
  onMoveCard,
  onUpdateCard,
}: CardDialogProps) {
  const router = useRouter();
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const description = useCardDescription({
    workspaceId,
    boardId,
    cardId: card.id,
    onDirtyChange,
    onLoadFailed: (message, isGone) => {
      toast.error(message);
      onClose();
      if (isGone) {
        router.refresh();
      }
    },
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (open || description.isSaving) {
          return;
        }
        if (description.isDirty) {
          setIsDiscarding(true);
          return;
        }
        onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-3 flex max-h-[calc(100svh-1.5rem)] translate-y-0 flex-col gap-4 overflow-y-auto p-5 sm:top-[88px] sm:max-h-[calc(100svh-7rem)] sm:max-w-[600px]"
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="-mx-1.5">
              <CardTitle
                workspaceId={workspaceId}
                boardId={boardId}
                cardId={card.id}
                title={card.title}
              />
            </div>
            <DialogDescription className="mt-0.5 truncate text-[13px] text-zinc-600">
              Na coluna {column.name}
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Fechar"
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 text-zinc-600 sm:size-8"
              />
            }
          >
            <X aria-hidden />
          </DialogClose>
        </div>

        <CardProperties
          workspaceId={workspaceId}
          boardId={boardId}
          card={card}
          columns={columns}
          onUpdateCard={onUpdateCard}
        />

        <CardDescription cardId={card.id} state={description} />

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            disabled={description.isSaving}
            onClick={() => {
              setIsDeleting(true);
            }}
            className="h-11 border-red-200 px-3.5 text-red-700 hover:bg-red-50 hover:text-red-700 sm:h-9"
          >
            Excluir card
          </Button>
          {description.isEditing ? (
            <CardDescriptionActions state={description} />
          ) : (
            <CardMoveMenu
              cardId={card.id}
              column={column}
              index={index}
              columns={columns}
              canReorder={canReorder}
              onMove={onMoveCard}
            />
          )}
        </div>

        <ConfirmDialog
          open={isDiscarding || isLeaving}
          onOpenChange={(open) => {
            if (open) {
              return;
            }
            setIsDiscarding(false);
            if (isLeaving) {
              onKeepEditing();
            }
          }}
          title="Descartar as alterações?"
          description="A descrição editada ainda não foi salva e será perdida."
          confirmLabel="Descartar"
          pendingLabel="Descartando…"
          cancelLabel="Continuar editando"
          onConfirm={() => {
            setIsDiscarding(false);
            description.cancel();
            if (isLeaving) {
              onDiscardLeaving();
            } else {
              onClose();
            }
            return DISCARDED;
          }}
        />
        <ConfirmDialog
          open={isDeleting}
          onOpenChange={setIsDeleting}
          title={`Excluir o card ${card.title}?`}
          description="O card será apagado para todo o workspace. Isso não pode ser desfeito."
          confirmLabel="Excluir card"
          pendingLabel="Excluindo card…"
          onConfirm={async () => {
            const result = await deleteCardAction(
              workspaceId,
              boardId,
              card.id,
            );
            if (result.status === "success") {
              onDeleted();
              onClose();
            }
            return result;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
