"use client";

import { CalendarDays, Check } from "lucide-react";
import { useToday } from "@/features/boards/hooks/use-today";
import {
  dueStatus,
  formatDueDay,
  type DueCard,
  type DueStatus,
} from "@/features/boards/lib/card-due";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<DueStatus, string> = {
  upcoming: "bg-muted text-fg-muted",
  today: "bg-accent text-accent-foreground",
  overdue: "bg-danger-bg text-danger-text",
  done: "bg-success-bg text-success-fg",
};

const STATUS_SUFFIX: Record<DueStatus, string> = {
  upcoming: "",
  today: ", vence hoje",
  overdue: ", atrasado",
  done: "",
};

export function DueBadge({ card }: { card: DueCard }) {
  const today = useToday();
  const status = dueStatus(card, today);
  if (status === null) {
    return null;
  }

  const Icon = status === "done" ? Check : CalendarDays;
  const day = card.dueOn === null ? null : formatDueDay(card.dueOn, today);
  const label =
    status === "done" ? "Concluído" : status === "today" ? "Hoje" : day;
  const spoken =
    status === "done"
      ? "Concluído"
      : `Prazo: ${day ?? ""}${STATUS_SUFFIX[status]}`;

  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1 rounded-[5px] pr-[7px] pl-1.5 text-[13px]/[22px] font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
        today === null && status !== "done" && "invisible",
      )}
    >
      <Icon aria-hidden className="size-3" strokeWidth={2.25} />
      <span aria-hidden>{label}</span>
      <span className="sr-only">{spoken}</span>
    </span>
  );
}
