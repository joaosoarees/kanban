"use client";

import { CircleAlert, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardComments } from "@/features/boards/hooks/use-card-comments";
import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";

type CardCommentsProps = {
  workspaceId: string;
  boardId: string;
  cardId: string;
  count: number;
  onDirtyChange: (isDirty: boolean) => void;
};

const SKELETON_ROWS = [
  { id: "first", name: "w-[180px]", lines: ["w-[92%]", "w-[60%]"] },
  { id: "second", name: "w-[140px]", lines: ["w-[85%]", "w-[40%]"] },
  { id: "third", name: "w-[200px]", lines: ["w-[70%]"] },
];

const numberFormat = new Intl.NumberFormat("pt-BR");

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
  count,
  onDirtyChange,
}: CardCommentsProps) {
  const comments = useCardComments(workspaceId, boardId, cardId);
  const [hasDraft, setHasDraft] = useState(false);
  const [editing, setEditing] = useState<ReadonlySet<string>>(new Set());
  const isDirty = hasDraft || editing.size > 0;
  const reportDirty = useEffectEvent(onDirtyChange);

  useEffect(() => {
    reportDirty(isDirty);
  }, [isDirty]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [isDirty]);

  const ref = { workspaceId, boardId, cardId };

  return (
    <section
      aria-labelledby={`${cardId}-comments`}
      className="flex flex-col gap-3"
    >
      <h3
        id={`${cardId}-comments`}
        className="flex items-center gap-1.5 text-sm font-medium"
      >
        Comentários
        {comments.status === "ready" && count > 0 && (
          <span className="text-[13px] font-normal text-fg-muted">
            {numberFormat.format(count)}
          </span>
        )}
      </h3>
      <CommentComposer
        {...ref}
        onCreated={comments.put}
        onDraftChange={setHasDraft}
      />
      {comments.status === "loading" && <CommentsSkeleton />}
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
      {comments.status === "ready" && comments.comments.length > 0 && (
        <ul className="flex flex-col gap-4">
          {comments.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              {...ref}
              comment={comment}
              onSaved={comments.put}
              onRemoved={comments.remove}
              onEditingChange={(commentId, isEditing) => {
                setEditing((current) => {
                  if (current.has(commentId) === isEditing) {
                    return current;
                  }
                  const next = new Set(current);
                  if (isEditing) {
                    next.add(commentId);
                  } else {
                    next.delete(commentId);
                  }
                  return next;
                });
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
    </section>
  );
}
