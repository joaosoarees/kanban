"use client";

import { useEffect, useRef } from "react";
import type { CardDescriptionState } from "@/components/boards/use-card-description";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CARD_DESCRIPTION_MAX_LENGTH } from "@/lib/card-schemas";
import { cn } from "@/lib/utils";

const BOX =
  "max-h-[50svh] min-h-37 w-full flex-1 rounded-lg border bg-card px-2.5 py-2 text-[15px]/[22px] whitespace-pre-wrap wrap-anywhere outline-hidden focus-visible:ring-3 sm:text-sm/[22px]";
const numberFormat = new Intl.NumberFormat("pt-BR");

type CardDescriptionProps = {
  cardId: string;
  state: CardDescriptionState;
};

export function CardDescription({ cardId, state }: CardDescriptionProps) {
  const labelId = `${cardId}-description-label`;
  const messageId = `${cardId}-description-message`;
  const { draft, error, saved, isEditing } = state;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    } else if (wasEditing.current) {
      viewRef.current?.focus();
    }
    wasEditing.current = isEditing;
  }, [isEditing]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p id={labelId} className="mb-1.5 text-sm font-medium">
        Descrição
      </p>
      {state.isLoading && (
        <output className="block">
          <span className="sr-only">Carregando a descrição…</span>
          <Skeleton aria-hidden className="h-37 w-full bg-muted-strong" />
        </output>
      )}
      {!state.isLoading && draft !== null && (
        <>
          <textarea
            ref={textareaRef}
            aria-labelledby={labelId}
            aria-invalid={error === undefined ? undefined : true}
            aria-describedby={messageId}
            value={draft}
            readOnly={state.isSaving}
            maxLength={CARD_DESCRIPTION_MAX_LENGTH}
            onChange={(event) => {
              state.change(event.target.value);
            }}
            className={cn(
              BOX,
              "resize-none",
              error === undefined
                ? "border-ring focus-visible:ring-ring/50"
                : "border-destructive focus-visible:ring-destructive/20",
            )}
          />
          <p
            id={messageId}
            aria-live="polite"
            className={cn(
              "mt-1 flex h-5 items-center gap-1.5 text-[13px]/5",
              error === undefined ? "text-fg-muted" : "text-danger-text",
            )}
          >
            {error !== undefined && (
              <span
                aria-hidden
                className="size-[5px] shrink-0 rounded-full bg-destructive"
              />
            )}
            {error ??
              `${numberFormat.format(draft.length)} de ${numberFormat.format(CARD_DESCRIPTION_MAX_LENGTH)}`}
          </p>
        </>
      )}
      {!state.isLoading && draft === null && (
        <button
          ref={viewRef}
          type="button"
          aria-label={
            saved === null ? "Adicionar uma descrição" : "Editar a descrição"
          }
          onClick={state.startEditing}
          className={cn(
            BOX,
            "flex cursor-text items-start overflow-y-auto border-border text-left transition-colors duration-150 hover:border-border-control focus-visible:border-ring focus-visible:ring-ring/50 motion-reduce:transition-none",
            saved === null && "text-fg-muted",
          )}
        >
          <span className="min-w-0">{saved ?? "Adicione uma descrição…"}</span>
        </button>
      )}
    </div>
  );
}

export function CardDescriptionActions({
  state,
}: {
  state: CardDescriptionState;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        disabled={state.isSaving}
        onClick={state.cancel}
        className="h-11 px-3.5 sm:h-9"
      >
        Cancelar
      </Button>
      <PendingButton
        isPending={state.isSaving}
        pendingLabel="Salvando a descrição…"
        onClick={state.save}
        className={cn("h-11 w-[76px] sm:h-9", primaryButton)}
      >
        Salvar
      </PendingButton>
    </div>
  );
}
