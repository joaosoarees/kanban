"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CircleAlert, Plus, RefreshCw } from "lucide-react";
import { useRef } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CardChecklistState } from "@/features/boards/hooks/use-card-checklist";
import type { ChecklistFormsState } from "@/features/boards/hooks/use-checklist-forms";
import { countDone } from "@/features/boards/lib/checklist-list";
import { MAX_CHECKLIST_ITEMS } from "@/features/boards/lib/checklist-schemas";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import { ChecklistItem } from "./checklist-item";
import { ChecklistNotice, ChecklistTextForm } from "./checklist-text-form";

const DISCARDED: ActionResult = { status: "success", data: undefined };
const SKELETON_WIDTHS = ["w-[62%]", "w-[80%]", "w-[45%]", "w-[70%]", "w-[55%]"];

const screenReaderInstructions = {
  draggable: "Use o menu da alça para mover o item.",
};

const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

type CardChecklistProps = {
  cardId: string;
  knownTotal: number;
  knownDone: number;
  checklist: CardChecklistState;
  forms: ChecklistFormsState;
};

export function CardChecklist({
  cardId,
  knownTotal,
  knownDone,
  checklist,
  forms,
}: CardChecklistProps) {
  const dragEndedAt = useRef(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const { items, status, notice } = checklist;
  const isLoaded = status === "ready" || status === "reloading";
  const total = isLoaded ? items.length : knownTotal;
  const done = isLoaded ? countDone(items) : knownDone;
  const isFull = items.length >= MAX_CHECKLIST_ITEMS;
  const allDone = total > 0 && done === total;
  const headingId = `${cardId}-checklist`;
  const textOf = (id: UniqueIdentifier) =>
    items.find((item) => item.id === id)?.text ?? "";
  const positionOf = (id: UniqueIdentifier) =>
    `posição ${items.findIndex((item) => item.id === id) + 1} de ${items.length}`;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Item ${textOf(active.id)} selecionado.`,
    onDragOver: ({ over }) =>
      over ? `Sobre a ${positionOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Item ${textOf(active.id)} solto na ${positionOf(over.id)}.`
        : `Movimento de ${textOf(active.id)} cancelado.`,
    onDragCancel: ({ active }) =>
      `Movimento de ${textOf(active.id)} cancelado.`,
  };

  return (
    <section
      aria-labelledby={headingId}
      className="flex shrink-0 flex-col gap-2"
    >
      <div className="flex h-6 items-center gap-2.5">
        <h3 id={headingId} className="text-sm font-medium">
          Checklist
        </h3>
        {total > 0 && (
          <>
            <span
              className={cn(
                "min-w-9 text-[13px] font-medium tabular-nums",
                allDone ? "text-success-fg" : "text-fg-muted",
              )}
            >
              {done}/{total}
            </span>
            <progress
              aria-label="Itens concluídos"
              value={done}
              max={total}
              className={cn(
                "h-1.5 flex-1 appearance-none overflow-hidden rounded-full bg-muted-strong [&::-moz-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted-strong [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-150 motion-reduce:[&::-webkit-progress-value]:transition-none",
                allDone
                  ? "[&::-moz-progress-bar]:bg-success-fg [&::-webkit-progress-value]:bg-success-fg"
                  : "[&::-moz-progress-bar]:bg-brand [&::-webkit-progress-value]:bg-brand",
              )}
            />
          </>
        )}
      </div>

      {status === "loading" && knownTotal > 0 && (
        <output className="flex flex-col">
          <span className="sr-only">Carregando o checklist…</span>
          {Array.from(
            { length: Math.min(knownTotal, MAX_CHECKLIST_ITEMS) },
            (_, index) => (
              <span
                key={index}
                aria-hidden
                className="flex h-9 items-center gap-2 pl-7"
              >
                <Skeleton className="size-4 rounded bg-muted-strong" />
                <Skeleton
                  className={cn(
                    "h-3 bg-muted-strong",
                    SKELETON_WIDTHS[index % SKELETON_WIDTHS.length],
                  )}
                />
              </span>
            ),
          )}
        </output>
      )}

      {status === "failed" && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2.5 rounded-lg border border-danger-border bg-danger-bg px-3 py-2.5 text-sm text-danger-text"
        >
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          Não foi possível carregar o checklist.
          <Button
            variant="outline"
            onClick={checklist.retry}
            className="ml-auto h-11 px-2.5 text-[13px] text-foreground sm:h-8"
          >
            <RefreshCw aria-hidden />
            Tentar de novo
          </Button>
        </div>
      )}

      {isLoaded && items.length > 0 && (
        <DndContext
          sensors={sensors}
          accessibility={{ announcements, screenReaderInstructions }}
          collisionDetection={closestCenter}
          modifiers={[verticalOnly]}
          onDragEnd={({ active, over }) => {
            dragEndedAt.current = Date.now();
            if (over === null || active.id === over.id) {
              return;
            }
            const index = items.findIndex(({ id }) => id === over.id);
            checklist.move(String(active.id), index);
          }}
          onDragCancel={() => {
            dragEndedAt.current = Date.now();
          }}
        >
          <SortableContext
            items={items.map(({ id }) => id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col">
              {items.map((item, index) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  index={index}
                  count={items.length}
                  textButtonRef={forms.edit.textButtonRef(item.id)}
                  wasDragged={() => Date.now() - dragEndedAt.current < 300}
                  editor={
                    forms.edit.itemId === item.id ? (
                      <ChecklistTextForm
                        form={forms.edit}
                        label="Editar o item"
                        submitLabel="Salvar"
                        pendingLabel="Salvando…"
                        messageId={`${item.id}-edit-message`}
                        hint="salva"
                        onCancel={forms.edit.cancel}
                      />
                    ) : null
                  }
                  onToggle={(completed) => {
                    checklist.toggle(item.id, completed);
                  }}
                  onEdit={() => {
                    forms.edit.start(item);
                  }}
                  onRemove={() => {
                    checklist.remove(item.id);
                  }}
                  onMove={(target) => {
                    checklist.move(item.id, target);
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {status !== "failed" &&
        (forms.add.isOpen ? (
          <div className="flex flex-col gap-1 pl-9 sm:pl-[52px]">
            <ChecklistTextForm
              form={forms.add}
              label="Novo item"
              submitLabel="Adicionar"
              pendingLabel="Adicionando…"
              messageId={`${cardId}-checklist-add-message`}
              hint="adiciona"
              onCancel={forms.add.close}
            />
            <ChecklistNotice notice={notice} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button
              ref={(node) => {
                forms.add.buttonRef(node);
              }}
              type="button"
              variant="ghost"
              disabled={!isLoaded || isFull}
              aria-describedby={isFull ? `${cardId}-checklist-full` : undefined}
              onClick={forms.add.open}
              className="h-11 gap-1.5 px-2 text-fg-secondary sm:h-8"
            >
              <Plus aria-hidden />
              Adicionar item
            </Button>
            {isFull && (
              <span
                id={`${cardId}-checklist-full`}
                className="text-[13px] text-fg-muted"
              >
                Limite de {MAX_CHECKLIST_ITEMS} itens
              </span>
            )}
            <ChecklistNotice notice={notice} />
          </div>
        ))}

      <ConfirmDialog
        open={forms.edit.nextItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            forms.edit.keepEditing();
          }
        }}
        title="Descartar as alterações?"
        description="A edição do item ainda não foi salva e será perdida."
        confirmLabel="Descartar"
        pendingLabel="Descartando…"
        cancelLabel="Continuar editando"
        onConfirm={() => {
          forms.edit.discardForNext();
          return DISCARDED;
        }}
      />
    </section>
  );
}
