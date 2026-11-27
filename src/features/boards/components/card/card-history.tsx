"use client";

import { CircleAlert, History, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  describeActivity,
  Name,
} from "@/features/boards/components/card/activity-phrase";
import type { CardActivityState } from "@/features/boards/hooks/use-card-activity";
import { useToday } from "@/features/boards/hooks/use-today";
import type { CardActivity } from "@/features/boards/lib/card-activity";
import { formatCommentDate } from "@/features/boards/lib/comment-date";
import { cn } from "@/lib/utils";

const SKELETON_ROWS = [
  { id: "first", line: "w-[85%]", date: "w-[90px]" },
  { id: "second", line: "w-[60%]", date: "w-[70px]" },
  { id: "third", line: "w-[75%]", date: "w-[80px]" },
  { id: "fourth", line: "w-[50%]", date: "w-[70px]" },
];

function HistorySkeleton() {
  return (
    <output className="flex flex-col gap-4">
      <span className="sr-only">Carregando o histórico…</span>
      {SKELETON_ROWS.map((row) => (
        <span key={row.id} aria-hidden className="flex gap-3">
          <Skeleton className="size-7 shrink-0 rounded-full bg-muted-strong" />
          <span className="flex flex-1 flex-col gap-2 pt-1.5">
            <Skeleton className={`h-3 ${row.line} bg-muted-strong`} />
            <Skeleton className={`h-3 ${row.date} bg-muted-strong`} />
          </span>
        </span>
      ))}
    </output>
  );
}

function HistoryEmpty() {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
      <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted text-fg-muted">
        <History aria-hidden className="size-5" />
      </span>
      <p className="text-sm font-medium">Nenhuma alteração registrada ainda.</p>
      <p className="text-[13px] text-fg-muted">
        As próximas mudanças aparecem aqui.
      </p>
    </div>
  );
}

type HistoryRowProps = {
  activity: CardActivity;
  today: string | null;
};

function HistoryRow({ activity, today }: HistoryRowProps) {
  const {
    icon: Icon,
    isSuccess,
    text,
    rename,
  } = describeActivity(activity, today);

  return (
    <li className="group relative flex gap-3 pb-4 last:pb-0">
      <span
        aria-hidden
        className="absolute top-7 bottom-0 left-3.5 w-px bg-border group-last:hidden"
      />
      <span
        aria-hidden
        className={cn(
          "relative flex size-7 shrink-0 items-center justify-center rounded-full",
          isSuccess
            ? "bg-success-bg text-success-fg"
            : "bg-muted text-fg-muted",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-[3px]">
        <p className="text-sm leading-[22px] text-pretty break-words text-fg-secondary">
          <Name>{activity.byViewer ? "Você" : activity.actorName}</Name> {text}
        </p>
        {rename !== null && (
          <div className="my-1 flex flex-col gap-0.5 border-l-2 pl-2.5 text-sm break-words">
            <del className="line-clamp-2 text-fg-muted">
              <span className="sr-only">Antes: </span>
              {rename.from}
            </del>
            <ins className="line-clamp-2 text-foreground no-underline">
              <span className="sr-only">Depois: </span>
              {rename.to}
            </ins>
          </div>
        )}
        <time
          dateTime={activity.createdAt}
          className="text-[13px] text-fg-muted"
        >
          {formatCommentDate(new Date(activity.createdAt), today)}
        </time>
      </div>
    </li>
  );
}

export function CardHistory({ history }: { history: CardActivityState }) {
  const today = useToday();

  if (history.status === "idle" || history.status === "loading") {
    return <HistorySkeleton />;
  }

  if (history.status === "failed") {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-2.5 rounded-lg border border-danger-border bg-danger-bg px-3 py-2.5 text-sm text-danger-text"
      >
        <CircleAlert aria-hidden className="size-4 shrink-0" />
        Não foi possível carregar o histórico.
        <Button
          variant="outline"
          onClick={history.retry}
          className="ml-auto h-11 px-2.5 text-[13px] text-foreground sm:h-8"
        >
          <RefreshCw aria-hidden />
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (history.activities.length === 0) {
    return <HistoryEmpty />;
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col">
        {history.activities.map((activity) => (
          <HistoryRow key={activity.id} activity={activity} today={today} />
        ))}
      </ol>
      {history.hasOlder && (
        <div className="flex flex-col items-start gap-1.5">
          <Button
            variant="outline"
            disabled={history.older === "loading"}
            onClick={() => void history.loadOlder()}
            className="h-11 min-w-[142px] sm:h-9"
          >
            {history.older === "loading" && (
              <Loader2
                aria-hidden
                className="animate-spin motion-reduce:animate-none"
              />
            )}
            {history.older === "loading"
              ? "Carregando…"
              : history.older === "failed"
                ? "Tentar de novo"
                : "Ver anteriores"}
          </Button>
          {history.older === "failed" && (
            <p
              role="alert"
              className="flex items-center gap-1.5 text-[13px] text-danger-text"
            >
              <CircleAlert aria-hidden className="size-3.5 shrink-0" />
              Não foi possível carregar o histórico anterior.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
