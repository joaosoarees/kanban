"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CardComments } from "@/features/boards/components/card/card-comments";
import {
  CardDescription,
  CardDescriptionActions,
} from "@/features/boards/components/card/card-description";
import { CardMoveMenu } from "@/features/boards/components/card/card-move-menu";
import { CardProperties } from "@/features/boards/components/card/card-properties";
import { CardTitle } from "@/features/boards/components/card/card-title";
import type {
  BoardCard,
  BoardColumn,
  CardUpdate,
} from "@/features/boards/hooks/use-board-columns";
import type { CardCommentsState } from "@/features/boards/hooks/use-card-comments";
import type { CardDescriptionState } from "@/features/boards/hooks/use-card-description";
import type { CommentFormsState } from "@/features/boards/hooks/use-comment-forms";
import { deleteCardAction } from "@/features/boards/server/card-actions";

type CardDialogBodyProps = {
  workspaceId: string;
  boardId: string;
  card: BoardCard;
  column: BoardColumn;
  index: number;
  columns: BoardColumn[];
  canReorder: boolean;
  description: CardDescriptionState;
  comments: CardCommentsState;
  commentForms: CommentFormsState;
  onDeleted: () => void;
  onMoveCard: (cardId: string, columnId: string, index: number) => void;
  onUpdateCard: (update: CardUpdate) => void;
};

export function CardDialogBody({
  workspaceId,
  boardId,
  card,
  column,
  index,
  columns,
  canReorder,
  description,
  comments,
  commentForms,
  onDeleted,
  onMoveCard,
  onUpdateCard,
}: CardDialogBodyProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
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
          <DialogDescription className="mt-0.5 truncate text-[13px] text-fg-muted">
            Na coluna {column.name}
          </DialogDescription>
        </div>
        <DialogClose
          aria-label="Fechar"
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 text-fg-muted sm:size-8"
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

      <CardComments
        workspaceId={workspaceId}
        boardId={boardId}
        cardId={card.id}
        count={card.commentCount}
        comments={comments}
        forms={commentForms}
      />

      <Separator />

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          disabled={description.isSaving}
          onClick={() => {
            setIsDeleting(true);
          }}
          className="h-11 border-danger-border px-3.5 text-danger-text hover:bg-danger-bg hover:text-danger-text sm:h-9"
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
        open={isDeleting}
        onOpenChange={setIsDeleting}
        title={`Excluir o card ${card.title}?`}
        description="O card será apagado para todo o workspace. Isso não pode ser desfeito."
        confirmLabel="Excluir card"
        pendingLabel="Excluindo card…"
        onConfirm={async () => {
          const result = await deleteCardAction(workspaceId, boardId, card.id);
          if (result.status === "success") {
            onDeleted();
          }
          return result;
        }}
      />
    </>
  );
}
