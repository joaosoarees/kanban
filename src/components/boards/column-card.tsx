"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, UnfoldHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { deleteColumnAction } from "@/app/(app)/w/[slug]/b/column-actions";
import { AddCard } from "@/components/boards/add-card";
import { BoardCardButton } from "@/components/boards/board-card";
import { ColumnMenu } from "@/components/boards/column-menu";
import { ColumnNameEditor } from "@/components/boards/column-name-editor";
import type { BoardColumn } from "@/components/boards/use-board-columns";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollapsedColumns } from "@/stores/collapsed-columns";

const CARD =
  "flex h-full w-[312px] shrink-0 snap-center flex-col rounded-xl bg-zinc-100 p-2 sm:w-72";

function cardCountLabel(count: number) {
  if (count === 0) {
    return "Sem cards";
  }
  return count === 1 ? "1 card" : `${count} cards`;
}

function deleteDescription(cardCount: number) {
  if (cardCount === 0) {
    return "A coluna será apagada para todo o workspace. Isso não pode ser desfeito.";
  }
  const cards = cardCount === 1 ? "seu card" : `seus ${cardCount} cards`;
  return `A coluna e ${cards} serão apagados para todo o workspace. Isso não pode ser desfeito.`;
}

type ColumnCardProps = {
  workspaceId: string;
  boardId: string;
  column: BoardColumn;
  index: number;
  total: number;
  onMove: (columnId: string, targetIndex: number) => void;
  onDeleted: () => void;
};

export function ColumnCard({
  workspaceId,
  boardId,
  column,
  index,
  total,
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
  } = useSortable({ id: column.id, disabled: isRenaming });

  const titleRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"title" | "expand" | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const revealAboveCount = useRef<number | null>(null);
  const cardCount = column.cards.length;

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
        className="flex h-full w-12 shrink-0 snap-center flex-col items-center gap-3 rounded-xl bg-zinc-100 py-2 motion-reduce:transition-none!"
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
          className="size-11 text-zinc-600 hover:bg-zinc-200 sm:size-8"
        >
          <UnfoldHorizontal aria-hidden />
        </Button>
        <span className="text-[13px] font-medium text-zinc-600">
          <span aria-hidden>{cardCount}</span>
          <span className="sr-only">{cardCountLabel(cardCount)}</span>
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
        CARD,
        "motion-reduce:transition-none!",
        isDragging && "border-2 border-dashed border-brand bg-indigo-50 p-1.5",
      )}
    >
      <div
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
            className="hidden h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-zinc-500 outline-hidden hover:text-zinc-800 focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing sm:flex"
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
              className="h-11 min-w-0 flex-1 cursor-text truncate rounded-md px-2 text-left text-[15px] font-semibold outline-hidden hover:bg-zinc-200 focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8 sm:text-sm"
            >
              {column.name}
            </button>
          )}
          {!isRenaming && (
            <span className="min-w-5 shrink-0 text-center text-[13px] font-medium text-zinc-600">
              <span aria-hidden>{cardCount}</span>
              <span className="sr-only">{cardCountLabel(cardCount)}</span>
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
          {cardCount === 0 ? (
            <p className="h-6 shrink-0 px-2 text-[13px]/6 text-zinc-600">
              Sem cards
            </p>
          ) : (
            column.cards.map((card) => (
              <BoardCardButton key={card.id} card={card} />
            ))
          )}
        </div>
        <AddCard
          workspaceId={workspaceId}
          boardId={boardId}
          columnId={column.id}
          onCreated={() => {
            revealAboveCount.current = cardCount;
          }}
        />
      </div>
      <ConfirmDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        title={`Excluir a coluna ${column.name}?`}
        description={deleteDescription(cardCount)}
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

export function ColumnPreview({
  name,
  cardCount,
}: {
  name: string;
  cardCount: number;
}) {
  return (
    <div
      className={cn(
        CARD,
        "rotate-[1.5deg] cursor-grabbing shadow-xl motion-reduce:rotate-0",
      )}
    >
      <div className="flex h-10 items-center gap-1">
        <span className="flex h-8 w-5 items-center justify-center text-zinc-500">
          <GripVertical aria-hidden className="size-[15px]" />
        </span>
        <span className="truncate px-2 text-sm font-semibold">{name}</span>
      </div>
      <p className="mt-1 h-6 px-2 text-[13px]/6 text-zinc-600">
        {cardCountLabel(cardCount)}
      </p>
    </div>
  );
}
