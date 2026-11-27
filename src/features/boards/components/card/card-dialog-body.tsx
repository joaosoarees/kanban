"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CardChecklist } from "@/features/boards/components/card/card-checklist";
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
import type { CardChecklistState } from "@/features/boards/hooks/use-card-checklist";
import type { CardCommentsState } from "@/features/boards/hooks/use-card-comments";
import type { CardDescriptionState } from "@/features/boards/hooks/use-card-description";
import type { ChecklistFormsState } from "@/features/boards/hooks/use-checklist-forms";
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
  checklist: CardChecklistState;
  checklistForms: ChecklistFormsState;
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
  checklist,
  checklistForms,
  comments,
  commentForms,
  onDeleted,
  onMoveCard,
  onUpdateCard,
}: CardDialogBodyProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <div className="flex items-start gap-2 lg:px-5 lg:pt-5 lg:pb-4">
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

      <div className="flex flex-col gap-4 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)] lg:gap-0 lg:border-t">
        <div className="contents lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:overflow-y-auto lg:px-5 lg:pt-4 lg:pb-5">
          <CardProperties
            workspaceId={workspaceId}
            boardId={boardId}
            card={card}
            columns={columns}
            onUpdateCard={onUpdateCard}
          />

          <CardDescription cardId={card.id} state={description} />

          <CardChecklist
            cardId={card.id}
            knownTotal={card.checklistTotal}
            knownDone={card.checklistDone}
            checklist={checklist}
            forms={checklistForms}
          />

          <Separator className="order-2 lg:order-none" />

          <div className="order-2 flex items-center justify-between gap-2 lg:order-none">
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
        </div>

        <div className="order-1 lg:order-none lg:min-h-0 lg:overflow-y-auto lg:border-l lg:px-5 lg:pt-4 lg:pb-5">
          <CardComments
            workspaceId={workspaceId}
            boardId={boardId}
            cardId={card.id}
            count={card.commentCount}
            comments={comments}
            forms={commentForms}
          />
        </div>
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
