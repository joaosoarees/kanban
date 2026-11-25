"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, UnfoldHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AddCard } from "@/components/boards/add-card";
import { COLUMN_DROP } from "@/components/boards/card-keyboard";
import { SortableCard } from "@/components/boards/sortable-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteColumnAction } from "@/features/boards/column-actions";
import { ColumnMenu } from "@/features/boards/components/column-menu";
import { ColumnNameEditor } from "@/features/boards/components/column-name-editor";
import {
  cardCountLabel,
  COLUMN_SHELL,
  deleteColumnDescription,
} from "@/features/boards/components/column-preview";
import type {
  BoardCard,
  BoardColumn,
} from "@/features/boards/hooks/use-board-columns";
import type { DragKind } from "@/features/boards/hooks/use-board-drag";
import { cn } from "@/lib/utils";
import { useCollapsedColumns } from "@/stores/collapsed-columns";

type ColumnCardProps = {
  workspaceId: string;
  boardId: string;
  column: BoardColumn;
  visibleCards: BoardCard[] | null;
  onCardCreated: (cardId: string) => void;
  index: number;
  total: number;
  dragKind: DragKind | null;
  onMove: (columnId: string, targetIndex: number) => void;
  onDeleted: () => void;
};

export function ColumnCard({
  workspaceId,
  boardId,
  column,
  visibleCards,
  onCardCreated,
  index,
  total,
  dragKind,
  onMove,
  onDeleted,
}: ColumnCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isCollapsed = useCollapsedColumns((state) =>
    state.collapsedIds.includes(column.id),
  );
  const toggleCollapsed = useCollapsedColumns((state) => state.toggle);
  const forgetCollapsed = useCollapsedColumns((state) => state.forget);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column" },
    disabled: { draggable: isRenaming, droppable: dragKind === "card" },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `${COLUMN_DROP}:${column.id}`,
    data: { type: COLUMN_DROP, columnId: column.id },
    disabled: dragKind !== "card" || isCollapsed,
  });

  const titleRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"title" | "expand" | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const revealAboveCount = useRef<number | null>(null);
  const cardCount = column.cards.length;
  const filteredCards = cardCount > 0 ? visibleCards : null;
  const cards = filteredCards ?? column.cards;
  const countLabel = cardCountLabel(cardCount, filteredCards?.length ?? null);
  const countText =
    filteredCards === null ? cardCount : `${cards.length} de ${cardCount}`;

  useEffect(() => {
    if (pendingFocus.current === "expand" && isCollapsed) {
      pendingFocus.current = null;
      expandRef.current?.focus();
    }
    if (pendingFocus.current === "title" && !isCollapsed && !isRenaming) {
      pendingFocus.current = null;
      titleRef.current?.focus();
    }
  }, [isCollapsed, isRenaming]);

  useEffect(() => {
    if (
      revealAboveCount.current !== null &&
      cardCount > revealAboveCount.current
    ) {
      revealAboveCount.current = null;
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }
  }, [cardCount]);

  const style = { transform: CSS.Translate.toString(transform), transition };

  if (isCollapsed) {
    return (
      <section
        ref={setNodeRef}
        style={style}
        aria-label={`Coluna ${column.name}, recolhida`}
        className={cn(
          "flex h-full w-12 shrink-0 snap-center flex-col items-center gap-3 rounded-xl bg-muted py-2 motion-reduce:transition-none!",
          dragKind === "card" && "opacity-55",
        )}
      >
        <Button
          ref={expandRef}
          data-column-focus={column.id}
          variant="ghost"
          size="icon"
          aria-label={`Expandir a coluna ${column.name}`}
          onClick={() => {
            pendingFocus.current = "title";
            toggleCollapsed(column.id);
          }}
          className="size-11 text-fg-muted hover:bg-muted-strong sm:size-8"
        >
          <UnfoldHorizontal aria-hidden />
        </Button>
        <span className="text-[13px] font-medium text-fg-muted">
          <span aria-hidden>{cards.length}</span>
          <span className="sr-only">{countLabel}</span>
        </span>
        <span className="min-h-0 truncate text-sm font-semibold [writing-mode:vertical-rl]">
          {column.name}
        </span>
      </section>
    );
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      aria-label={`Coluna ${column.name}`}
      className={cn(
        COLUMN_SHELL,
        "motion-reduce:transition-none!",
        isDragging && "border-2 border-dashed border-brand-fg bg-accent p-1.5",
        isOver && "bg-accent",
      )}
    >
      <div
        ref={setDropRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isDragging && "opacity-0",
        )}
      >
        <div className="relative flex h-11 shrink-0 items-center gap-1 sm:h-10">
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Arrastar a coluna ${column.name}`}
            className="hidden h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-hidden hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing sm:flex"
            {...attributes}
            {...listeners}
          >
            <GripVertical aria-hidden className="size-[15px]" />
          </button>
          {isRenaming ? (
            <ColumnNameEditor
              workspaceId={workspaceId}
              boardId={boardId}
              columnId={column.id}
              name={column.name}
              onClose={(hadFocus) => {
                pendingFocus.current = hadFocus ? "title" : null;
                setIsRenaming(false);
              }}
            />
          ) : (
            <button
              ref={titleRef}
              data-column-focus={column.id}
              type="button"
              aria-label={`Renomear a coluna ${column.name}`}
              onClick={() => {
                setIsRenaming(true);
              }}
              className="h-11 min-w-0 flex-1 cursor-text truncate rounded-md px-2 text-left text-[15px] font-semibold outline-hidden hover:bg-muted-strong focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8 sm:text-sm"
            >
              {column.name}
            </button>
          )}
          {!isRenaming && (
            <span className="min-w-5 shrink-0 text-center text-[13px] font-medium whitespace-nowrap text-fg-muted">
              <span aria-hidden>{countText}</span>
              <span className="sr-only">{countLabel}</span>
            </span>
          )}
          <ColumnMenu
            name={column.name}
            canMoveLeft={index > 0}
            canMoveRight={index < total - 1}
            onRename={() => {
              setIsRenaming(true);
            }}
            onCollapse={() => {
              pendingFocus.current = "expand";
              setIsRenaming(false);
              toggleCollapsed(column.id);
            }}
            onMoveLeft={() => {
              onMove(column.id, index - 1);
            }}
            onMoveRight={() => {
              onMove(column.id, index + 1);
            }}
            onDelete={() => {
              setIsDeleting(true);
            }}
          />
        </div>
        <div
          ref={listRef}
          className="mt-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-px"
        >
          <SortableContext
            items={cards.map(({ id }) => id)}
            strategy={verticalListSortingStrategy}
          >
            {cards.length === 0 ? (
              <p className="h-6 shrink-0 px-2 text-[13px]/6 text-fg-muted">
                {filteredCards === null
                  ? "Sem cards"
                  : "Nenhum card com esses filtros."}
              </p>
            ) : (
              cards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  columnId={column.id}
                  isDragDisabled={visibleCards !== null}
                  isDropDisabled={dragKind === "column"}
                />
              ))
            )}
          </SortableContext>
        </div>
        <AddCard
          workspaceId={workspaceId}
          boardId={boardId}
          columnId={column.id}
          onCreated={(cardId) => {
            revealAboveCount.current = cardCount;
            onCardCreated(cardId);
          }}
        />
      </div>
      <ConfirmDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        title={`Excluir a coluna ${column.name}?`}
        description={deleteColumnDescription(cardCount)}
        confirmLabel="Excluir coluna"
        pendingLabel="Excluindo coluna…"
        onConfirm={async () => {
          const result = await deleteColumnAction(
            workspaceId,
            boardId,
            column.id,
          );
          if (result.status === "success") {
            forgetCollapsed(column.id);
            onDeleted();
          }
          return result;
        }}
      />
    </section>
  );
}
