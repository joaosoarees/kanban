"use client";

import { CircleAlert, Loader2, RefreshCw } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CardCommentsState } from "@/features/boards/hooks/use-card-comments";
import type { CommentFormsState } from "@/features/boards/hooks/use-comment-forms";
import type { ActionResult } from "@/lib/action-result";
import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";

type CardCommentsProps = {
  workspaceId: string;
  boardId: string;
  cardId: string;
  comments: CardCommentsState;
  forms: CommentFormsState;
};

const DISCARDED: ActionResult = { status: "success", data: undefined };

const SKELETON_ROWS = [
  { id: "first", name: "w-[180px]", lines: ["w-[92%]", "w-[60%]"] },
  { id: "second", name: "w-[140px]", lines: ["w-[85%]", "w-[40%]"] },
  { id: "third", name: "w-[200px]", lines: ["w-[70%]"] },
];

function CommentsSkeleton() {
  return (
    <output className="flex flex-col gap-4">
      <span className="sr-only">Carregando os comentários…</span>
      {SKELETON_ROWS.map((row) => (
        <span key={row.id} aria-hidden className="flex gap-2.5">
          <Skeleton className="size-7 shrink-0 rounded-full bg-muted-strong" />
          <span className="flex flex-1 flex-col gap-2 pt-2">
            <Skeleton className={`h-3 ${row.name} bg-muted-strong`} />
            {row.lines.map((width) => (
              <Skeleton
                key={width}
                className={`h-3 ${width} bg-muted-strong`}
              />
            ))}
          </span>
        </span>
      ))}
    </output>
  );
}

export function CardComments({
  workspaceId,
  boardId,
  cardId,
  comments,
  forms,
}: CardCommentsProps) {
  const ref = { workspaceId, boardId, cardId };

  return (
    <div className="@container flex flex-col gap-3">
      <CommentComposer cardId={cardId} composer={forms.composer} />
      {comments.status === "loading" && comments.comments.length === 0 && (
        <CommentsSkeleton />
      )}
      {comments.status === "failed" && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2.5 rounded-lg border border-danger-border bg-danger-bg px-3 py-2.5 text-sm text-danger-text"
        >
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          Não foi possível carregar os comentários.
          <Button
            variant="outline"
            onClick={comments.retry}
            className="ml-auto h-11 px-2.5 text-[13px] text-foreground sm:h-8"
          >
            <RefreshCw aria-hidden />
            Tentar de novo
          </Button>
        </div>
      )}
      {comments.status === "ready" && comments.comments.length === 0 && (
        <p className="text-[13px] text-fg-muted">Nenhum comentário ainda.</p>
      )}
      {comments.comments.length > 0 && (
        <ul className="flex flex-col gap-4">
          {comments.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              {...ref}
              comment={comment}
              edit={forms.edit}
              onDeleted={(commentId) => {
                comments.remove(commentId);
                forms.composer.focus();
              }}
            />
          ))}
        </ul>
      )}
      {comments.status === "ready" && comments.hasOlder && (
        <div className="flex flex-col items-start gap-1.5">
          <Button
            variant="outline"
            disabled={comments.older === "loading"}
            onClick={() => void comments.loadOlder()}
            className="h-11 min-w-[142px] sm:h-9"
          >
            {comments.older === "loading" && (
              <Loader2
                aria-hidden
                className="animate-spin motion-reduce:animate-none"
              />
            )}
            {comments.older === "loading"
              ? "Carregando…"
              : comments.older === "failed"
                ? "Tentar de novo"
                : "Ver anteriores"}
          </Button>
          {comments.older === "failed" && (
            <p
              role="alert"
              className="flex items-center gap-1.5 text-[13px] text-danger-text"
            >
              <CircleAlert aria-hidden className="size-3.5 shrink-0" />
              Não foi possível carregar os comentários anteriores.
            </p>
          )}
        </div>
      )}
      <ConfirmDialog
        open={forms.edit.nextComment !== null}
        onOpenChange={(open) => {
          if (!open) {
            forms.edit.keepEditing();
          }
        }}
        title="Descartar as alterações?"
        description="A edição do comentário ainda não foi salva e será perdida."
        confirmLabel="Descartar"
        pendingLabel="Descartando…"
        cancelLabel="Continuar editando"
        onConfirm={() => {
          forms.edit.discardForNext();
          return DISCARDED;
        }}
      />
    </div>
  );
}
