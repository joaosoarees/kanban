"use client";

import { Check, Pencil, Plus, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { LabelTag } from "@/components/boards/label-tag";
import type { BoardLabel } from "@/features/boards/components/board-meta";
import {
  LABEL_NAME_MAX_LENGTH,
  MAX_LABELS_PER_BOARD,
  MAX_LABELS_PER_CARD,
} from "@/lib/label-schemas";
import { cn } from "@/lib/utils";

export function comparable(text: string) {
  return text.trim().normalize("NFC").toLocaleLowerCase("pt-BR");
}

type LabelListProps = {
  labels: BoardLabel[];
  appliedIds: Set<string>;
  query: string;
  onQueryChange: (query: string) => void;
  onToggle: (labelId: string) => void;
  onEdit: (label: BoardLabel) => void;
  onCreate: (name: string) => void;
};

export function LabelList({
  labels,
  appliedIds,
  query,
  onQueryChange,
  onToggle,
  onEdit,
  onCreate,
}: LabelListProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const search = comparable(query);
  const matches = labels.filter(({ name }) =>
    comparable(name).includes(search),
  );
  const hasExactMatch = labels.some(({ name }) => comparable(name) === search);
  const canOfferCreate = search !== "" && !hasExactMatch;
  const isBoardFull = labels.length >= MAX_LABELS_PER_BOARD;
  const isCardFull = appliedIds.size >= MAX_LABELS_PER_CARD;

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      searchRef.current?.focus();
    }
  }, []);

  return (
    <>
      <label className="flex h-12 shrink-0 items-center gap-2 border-b px-2.5 text-fg-muted sm:h-10">
        <Search aria-hidden className="size-4 shrink-0" />
        <input
          ref={searchRef}
          value={query}
          maxLength={LABEL_NAME_MAX_LENGTH}
          aria-label="Buscar ou criar etiqueta"
          placeholder="Buscar ou criar etiqueta"
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (canOfferCreate && !isBoardFull) {
                onCreate(query.trim());
              }
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-hidden placeholder:text-muted-foreground sm:text-sm"
        />
      </label>

      {labels.length === 0 && search === "" && (
        <p className="px-3 pt-4 pb-3 text-sm text-fg-secondary">
          Crie a primeira etiqueta deste quadro digitando um nome.
        </p>
      )}
      {labels.length > 0 && matches.length === 0 && (
        <p className="px-3 pt-4 pb-2 text-sm text-fg-secondary">
          Nenhuma etiqueta com esse nome.
        </p>
      )}

      <div className="flex max-h-[min(306px,40svh)] flex-col overflow-y-auto p-1">
        {matches.map((label) => {
          const isApplied = appliedIds.has(label.id);
          const isBlocked = isCardFull && !isApplied;
          return (
            <div
              key={label.id}
              className="flex shrink-0 items-center rounded-md hover:bg-muted"
            >
              <label
                className={cn(
                  "relative flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md pl-2 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 sm:h-9",
                  isBlocked && "cursor-default opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  checked={isApplied}
                  disabled={isBlocked}
                  onChange={() => {
                    onToggle(label.id);
                  }}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border border-border-control bg-card text-on-color",
                    isApplied && "border-brand bg-brand",
                  )}
                >
                  {isApplied && <Check className="size-3" strokeWidth={3} />}
                </span>
                <LabelTag name={label.name} color={label.color} />
              </label>
              <button
                type="button"
                aria-label={`Editar etiqueta ${label.name}`}
                onClick={() => {
                  onEdit(label);
                }}
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[5px] text-fg-muted outline-hidden hover:bg-muted-strong focus-visible:ring-3 focus-visible:ring-ring/50 sm:mr-0.5 sm:size-7"
              >
                <Pencil aria-hidden className="size-3.5" />
              </button>
            </div>
          );
        })}
        {canOfferCreate && (
          <button
            type="button"
            disabled={isBoardFull}
            onClick={() => {
              onCreate(query.trim());
            }}
            className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm outline-hidden hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default disabled:text-muted-foreground disabled:hover:bg-transparent sm:h-9"
          >
            <Plus aria-hidden className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              Criar etiqueta “{query.trim()}”
            </span>
          </button>
        )}
      </div>

      {isCardFull && (
        <p className="border-t px-3 py-2 text-[13px]/[18px] text-fg-muted">
          Este card já tem {MAX_LABELS_PER_CARD} etiquetas. Remova uma para
          aplicar outra.
        </p>
      )}
      {isBoardFull && canOfferCreate && (
        <p className="border-t px-3 py-2 text-[13px]/[18px] text-fg-muted">
          Este quadro chegou a {MAX_LABELS_PER_BOARD} etiquetas. Exclua uma para
          criar outra.
        </p>
      )}
    </>
  );
}
