"use client";

import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  BoardCard,
  CardUpdate,
} from "@/features/boards/hooks/use-board-columns";
import { useToday } from "@/features/boards/hooks/use-today";
import {
  dayToDate,
  dueStatus,
  formatDueDate,
  localDay,
} from "@/features/boards/lib/card-due";
import { setCardDueAction } from "@/features/boards/server/card-due-actions";
import { cn } from "@/lib/utils";

const DUE_FAILED =
  "Não foi possível salvar o prazo. Desfizemos a mudança. Tente de novo.";

type DuePickerProps = {
  workspaceId: string;
  boardId: string;
  card: BoardCard;
  onUpdateCard: (update: CardUpdate) => void;
};

function dueLabel(card: BoardCard, today: string | null) {
  if (card.dueOn === null) {
    return { text: "Sem prazo", tone: "text-fg-muted" };
  }
  const date = formatDueDate(card.dueOn);
  const status = dueStatus(card, today);
  if (status === "overdue") {
    return { text: `${date} · atrasado`, tone: "text-danger-text" };
  }
  if (status === "today") {
    return { text: `Hoje, ${date}`, tone: "text-accent-foreground" };
  }
  return { text: date, tone: "" };
}

export function DuePicker({
  workspaceId,
  boardId,
  card,
  onUpdateCard,
}: DuePickerProps) {
  const today = useToday();
  const [isOpen, setIsOpen] = useState(false);
  const { text, tone } = dueLabel(card, today);
  const selected = card.dueOn === null ? undefined : dayToDate(card.dueOn);

  const save = (dueOn: string | null) => {
    if (dueOn === card.dueOn) {
      return;
    }
    onUpdateCard({
      cardId: card.id,
      change: (current) => ({ ...current, dueOn }),
      write: async () =>
        setCardDueAction(workspaceId, boardId, card.id, { dueOn }),
      failure: DUE_FAILED,
    });
  };

  return (
    <div className="flex w-full items-center gap-1 sm:w-fit">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          aria-label={`Prazo: ${text}. Alterar`}
          className="inline-flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md border border-border pr-2.5 pl-2 text-sm font-[450] outline-hidden transition-colors duration-150 hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-accent-border data-popup-open:bg-accent motion-reduce:transition-none sm:h-8 sm:flex-none sm:border-transparent sm:pr-2 sm:pl-1"
        >
          <span
            className={cn(
              "flex size-[22px] shrink-0 items-center justify-center",
              tone || "text-muted-foreground",
            )}
          >
            <CalendarDays aria-hidden className="size-[15px]" />
          </span>
          <span className={cn("min-w-0 truncate text-left", tone)}>{text}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-1.5">
          <Calendar
            mode="single"
            locale={ptBR}
            selected={selected}
            defaultMonth={
              selected ?? (today === null ? undefined : dayToDate(today))
            }
            onSelect={(date) => {
              if (date) {
                save(localDay(date));
              }
              setIsOpen(false);
            }}
            className="[--cell-size:--spacing(9)]"
            classNames={{
              today:
                "rounded-(--cell-radius) font-semibold text-brand-fg after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:z-20 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-current",
            }}
          />
        </PopoverContent>
      </Popover>
      {card.dueOn !== null && (
        <button
          type="button"
          aria-label="Remover prazo"
          onClick={() => {
            save(null);
          }}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-hidden transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none sm:size-7"
        >
          <X aria-hidden className="size-4 sm:size-3.5" />
        </button>
      )}
    </div>
  );
}
