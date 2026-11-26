"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import { primaryButton } from "@/components/button-styles";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { useActionForm } from "@/hooks/use-action-form";
import { useToday } from "@/features/boards/hooks/use-today";
import { formatCommentDate } from "@/features/boards/lib/comment-date";
import { commentSchema } from "@/features/boards/lib/comment-schemas";
import type { CardComment } from "@/features/boards/server/comment-queries";
import {
  deleteCommentAction,
  editCommentAction,
} from "@/features/boards/server/comment-actions";
import type { ActionResult } from "@/lib/action-result";
import { initialsOf } from "@/lib/initials";
import { runAction } from "@/lib/run-action";
import { cn } from "@/lib/utils";
import {
  CommentField,
  IDLE_FORM,
  type CommentFormState,
} from "./comment-field";

type CommentRef = { workspaceId: string; boardId: string; cardId: string };

type CommentItemProps = CommentRef & {
  comment: CardComment;
  onSaved: (comment: CardComment) => void;
  onRemoved: (commentId: string) => void;
  onDeleted: (commentId: string) => void;
  onEditStateChange: (commentId: string, state: CommentFormState) => void;
};

const DONE: ActionResult = { status: "success", data: undefined };

const TEXT_BUTTON =
  "inline-flex h-9 items-center rounded-md px-2 text-[13px] font-medium text-fg-secondary outline-hidden hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-7";

function CommentEditor({
  workspaceId,
  boardId,
  cardId,
  comment,
  onSaved,
  onGone,
  onCancel,
  onStateChange,
}: CommentRef & {
  comment: CardComment;
  onSaved: (comment: CardComment) => void;
  onGone: () => void;
  onCancel: () => void;
  onStateChange: (state: CommentFormState) => void;
}) {
  const { form, submit, isPending } = useActionForm({
    schema: commentSchema,
    defaultValues: { body: comment.body },
    action: async (values) =>
      editCommentAction(workspaceId, boardId, cardId, comment.id, values),
    failure: "Não foi possível salvar.",
    onSuccess: onSaved,
    onError: (error) => {
      if (error.gone === true) {
        toast.error(error.message);
        onGone();
      }
    },
  });
  const body = useWatch({ control: form.control, name: "body" });
  const { errors, isDirty } = form.formState;
  const reportState = useEffectEvent(onStateChange);

  useEffect(() => {
    reportState({ isDirty, isPending });
  }, [isDirty, isPending]);

  useEffect(
    () => () => {
      reportState(IDLE_FORM);
    },
    [],
  );

  const field = form.register("body", {
    onChange: () => {
      form.clearErrors("root");
    },
  });

  useEffect(() => {
    form.setFocus("body");
  }, [form]);

  return (
    <form onSubmit={submit} noValidate className="mt-1 [grid-area:body]">
      <CommentField
        {...field}
        value={body}
        aria-label="Editar o comentário"
        messageId={`${comment.id}-edit-message`}
        error={errors.body?.message ?? errors.root?.message}
        isPending={isPending}
        onSubmitShortcut={submit}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !isPending) {
            event.stopPropagation();
            onCancel();
          }
        }}
      >
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={onCancel}
          className="h-11 px-3.5 sm:h-9"
        >
          Cancelar
        </Button>
        <PendingButton
          type="submit"
          isPending={isPending}
          pendingLabel="Salvando o comentário…"
          className={cn("h-11 min-w-[84px] sm:h-9", primaryButton)}
        >
          Salvar
        </PendingButton>
      </CommentField>
    </form>
  );
}

export function CommentItem({
  comment,
  onSaved,
  onRemoved,
  onDeleted,
  onEditStateChange,
  ...ref
}: CommentItemProps) {
  const today = useToday();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (!isEditing && wasEditing.current) {
      editButtonRef.current?.focus();
    }
    wasEditing.current = isEditing;
  }, [isEditing]);

  const stopEditing = () => {
    setIsEditing(false);
  };

  const authorName = comment.author?.name ?? "Ex-membro";
  const showActions = !isEditing && (comment.canEdit || comment.canDelete);

  return (
    <li className="flex gap-2.5">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-strong text-[11px] font-semibold text-accent-foreground"
      >
        {initialsOf(authorName)}
      </span>
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] [grid-template-areas:'meta'_'body'_'actions'] sm:grid-cols-[minmax(0,1fr)_auto] sm:[grid-template-areas:'meta_actions'_'body_body']">
        <p className="flex h-7 min-w-0 items-center gap-1.5 text-[13px] whitespace-nowrap text-fg-muted [grid-area:meta]">
          <span className="truncate text-sm font-medium text-foreground">
            {authorName}
            {comment.canEdit && (
              <span className="font-normal text-fg-muted"> (você)</span>
            )}
          </span>
          <span>
            ·{" "}
            <time dateTime={comment.createdAt}>
              {formatCommentDate(new Date(comment.createdAt), today)}
            </time>
          </span>
          {comment.editedAt !== null && <span>· (editado)</span>}
        </p>
        {showActions && (
          <div className="mt-1 -ml-2 flex gap-0.5 [grid-area:actions] sm:mt-0 sm:ml-0">
            {comment.canEdit && (
              <button
                ref={editButtonRef}
                type="button"
                onClick={() => {
                  setIsEditing(true);
                }}
                className={TEXT_BUTTON}
              >
                Editar
              </button>
            )}
            {comment.canDelete && (
              <button
                type="button"
                onClick={() => {
                  setIsDeleting(true);
                }}
                className={TEXT_BUTTON}
              >
                Excluir
              </button>
            )}
          </div>
        )}
        {isEditing ? (
          <CommentEditor
            {...ref}
            comment={comment}
            onSaved={(saved) => {
              onSaved(saved);
              stopEditing();
            }}
            onGone={() => {
              onRemoved(comment.id);
            }}
            onCancel={stopEditing}
            onStateChange={(state) => {
              onEditStateChange(comment.id, state);
            }}
          />
        ) : (
          <p className="mt-0.5 text-sm/[22px] wrap-anywhere whitespace-pre-wrap [grid-area:body]">
            {comment.body}
          </p>
        )}
      </div>
      <ConfirmDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        title="Excluir o comentário?"
        description="Ele será apagado para todo o workspace. Isso não pode ser desfeito."
        confirmLabel="Excluir comentário"
        pendingLabel="Excluindo comentário…"
        onConfirm={async () => {
          const result = await runAction(
            async () =>
              deleteCommentAction(
                ref.workspaceId,
                ref.boardId,
                ref.cardId,
                comment.id,
              ),
            "Não foi possível excluir o comentário.",
          );
          setIsDeleting(false);
          if (result.status === "success" || result.gone === true) {
            onDeleted(comment.id);
            return DONE;
          }
          toast.error("Não foi possível excluir o comentário.", {
            description: "Tente de novo.",
          });
          return DONE;
        }}
      />
    </li>
  );
}
