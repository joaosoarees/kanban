"use client";

import { DndContext, DragOverlay, type Modifier } from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { Plus, SquareKanban } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { BoardCardPreview } from "@/components/boards/board-card";
import { CardDialogHost } from "@/components/boards/card-dialog-host";
import { primaryButton } from "@/components/button-styles";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddColumn } from "@/features/boards/components/add-column";
import { ColumnCard } from "@/features/boards/components/column-card";
import { ColumnPreview } from "@/features/boards/components/column-preview";
import {
  useBoardColumns,
  type BoardColumn,
} from "@/features/boards/hooks/use-board-columns";
import {
  screenReaderInstructions,
  useBoardDrag,
} from "@/features/boards/hooks/use-board-drag";
import {
  useBoardFilter,
  useVisibleCards,
} from "@/features/boards/hooks/use-board-filter";
import { locateCard } from "@/lib/card-moves";
import { cn } from "@/lib/utils";
import { useCollapsedColumns } from "@/stores/collapsed-columns";

const horizontalOnly: Modifier = ({ transform }) => ({ ...transform, y: 0 });

type BoardColumnsProps = {
  workspaceId: string;
  boardId: string;
  columns: BoardColumn[];
};

export function BoardColumns({
  workspaceId,
  boardId,
  columns: serverColumns,
}: BoardColumnsProps) {
  const {
    columns: confirmedColumns,
    move,
    moveCard,
    commitCardMove,
    updateCard,
  } = useBoardColumns(workspaceId, boardId, serverColumns);
  const {
    activeDrag,
    displayed: columns,
    sensors,
    announcements,
    collisionDetection,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
  } = useBoardDrag({
    columns: confirmedColumns,
    onMoveColumn: move,
    onCommitCard: commitCardMove,
  });
  const visibleCards = useVisibleCards(columns, useBoardFilter());
  const [isAdding, setIsAdding] = useState(false);
  const hasLoadedCollapsed = useCollapsedColumns((state) => state.hasLoaded);
  const addAnchorRef = useRef<HTMLDivElement>(null);
  const revealAboveCount = useRef<number | null>(null);
  const columnsRef = useRef<HTMLElement>(null);
  const emptyActionRef = useRef<HTMLButtonElement>(null);
  const refocusEmptyAction = useRef(false);
  const deletedColumn = useRef<{ id: string; index: number } | null>(null);

  useEffect(() => {
    const { persist } = useCollapsedColumns;
    void persist.rehydrate();

    const syncFromOtherTab = (event: StorageEvent) => {
      if (event.key === null || event.key === persist.getOptions().name) {
        void persist.rehydrate();
      }
    };
    window.addEventListener("storage", syncFromOtherTab);
    return () => {
      window.removeEventListener("storage", syncFromOtherTab);
    };
  }, []);

  useEffect(() => {
    if (
      revealAboveCount.current !== null &&
      columns.length > revealAboveCount.current
    ) {
      revealAboveCount.current = null;
      addAnchorRef.current?.scrollIntoView({
        block: "nearest",
        inline: "end",
      });
    }
  }, [columns.length]);

  useEffect(() => {
    if (!isAdding && refocusEmptyAction.current) {
      refocusEmptyAction.current = false;
      emptyActionRef.current?.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    const deleted = deletedColumn.current;
    if (deleted === null || columns.some(({ id }) => id === deleted.id)) {
      return;
    }
    deletedColumn.current = null;
    const neighbor = columns.at(Math.min(deleted.index, columns.length - 1));
    const neighborTarget = columnsRef.current?.querySelector<HTMLElement>(
      `[data-column-focus="${neighbor?.id}"]`,
    );
    const anyTarget = columnsRef.current?.querySelector<HTMLElement>(
      "[data-column-focus]",
    );
    (neighborTarget ?? anyTarget ?? emptyActionRef.current)?.focus();
  }, [columns]);

  const activeColumn =
    activeDrag?.kind === "column"
      ? columns.find(({ id }) => id === activeDrag.id)
      : undefined;
  const activeCard =
    activeDrag?.kind === "card"
      ? locateCard(columns, activeDrag.id)?.card
      : undefined;

  const cardDialog = (
    <Suspense fallback={null}>
      <CardDialogHost
        workspaceId={workspaceId}
        boardId={boardId}
        columns={confirmedColumns}
        onMoveCard={moveCard}
        onUpdateCard={updateCard}
      />
    </Suspense>
  );

  if (columns.length === 0 && !isAdding) {
    return (
      <div className="mx-auto mt-2 w-full max-w-5xl px-3 sm:mt-8 sm:px-6">
        <EmptyState
          icon={SquareKanban}
          title="Este quadro não tem colunas"
          description="Adicione a primeira coluna para organizar o trabalho."
          action={
            <Button
              ref={emptyActionRef}
              onClick={() => {
                setIsAdding(true);
              }}
              className={cn("h-10 px-4", primaryButton)}
            >
              <Plus aria-hidden />
              Adicionar coluna
            </Button>
          }
        />
        {cardDialog}
      </div>
    );
  }

  if (!hasLoadedCollapsed) {
    return (
      <div
        aria-hidden
        className="flex min-h-0 flex-1 gap-2.5 overflow-hidden px-3 pb-3 sm:gap-3 sm:px-6 sm:pb-4"
      >
        {columns.map(({ id }) => (
          <Skeleton
            key={id}
            className="h-full w-[312px] shrink-0 rounded-xl bg-muted-strong sm:w-72"
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      id="board-columns"
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <section
        ref={columnsRef}
        aria-label="Colunas do quadro"
        className="relative flex min-h-0 flex-1 snap-x snap-mandatory gap-2.5 overflow-x-auto px-3 pb-3 sm:snap-none sm:gap-3 sm:px-6 sm:pb-4"
      >
        <SortableContext
          items={columns.map(({ id }) => id)}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((column, index) => (
            <ColumnCard
              key={column.id}
              workspaceId={workspaceId}
              boardId={boardId}
              column={column}
              visibleCards={visibleCards.cardsOf?.(column) ?? null}
              onCardCreated={visibleCards.reveal}
              index={index}
              total={columns.length}
              dragKind={activeDrag?.kind ?? null}
              onMove={move}
              onDeleted={() => {
                deletedColumn.current = { id: column.id, index };
              }}
            />
          ))}
        </SortableContext>
        <AddColumn
          workspaceId={workspaceId}
          boardId={boardId}
          isOpen={isAdding}
          onOpenChange={(open) => {
            refocusEmptyAction.current = !open;
            setIsAdding(open);
          }}
          anchorRef={addAnchorRef}
          onCreated={() => {
            revealAboveCount.current = columns.length;
            setIsAdding(false);
          }}
        />
      </section>
      <DragOverlay
        dropAnimation={null}
        modifiers={activeColumn ? [horizontalOnly] : []}
      >
        {activeColumn && (
          <ColumnPreview
            name={activeColumn.name}
            cardCount={activeColumn.cards.length}
          />
        )}
        {activeCard && <BoardCardPreview card={activeCard} />}
      </DragOverlay>
      {cardDialog}
    </DndContext>
  );
}
