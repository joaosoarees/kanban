"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Plus, SquareKanban } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { AddColumn } from "@/components/boards/add-column";
import { CardDialogHost } from "@/components/boards/card-dialog-host";
import { ColumnCard, ColumnPreview } from "@/components/boards/column-card";
import {
  useBoardColumns,
  type BoardColumn,
} from "@/components/boards/use-board-columns";
import { primaryButton } from "@/components/button-styles";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCollapsedColumns } from "@/stores/collapsed-columns";

const horizontalOnly: Modifier = ({ transform }) => ({ ...transform, y: 0 });

const screenReaderInstructions = {
  draggable:
    "Pressione espaço para pegar a coluna, use as setas para mudar de lugar, espaço para soltar e Esc para cancelar.",
};

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
  const { columns, move, moveCard } = useBoardColumns(
    workspaceId,
    boardId,
    serverColumns,
  );
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const hasLoadedCollapsed = useCollapsedColumns((state) => state.hasLoaded);
  const addAnchorRef = useRef<HTMLDivElement>(null);
  const revealAboveCount = useRef<number | null>(null);
  const columnsRef = useRef<HTMLElement>(null);
  const emptyActionRef = useRef<HTMLButtonElement>(null);
  const refocusEmptyAction = useRef(false);
  const deletedColumn = useRef<{ id: string; index: number } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const nameOf = (id: UniqueIdentifier) =>
    columns.find((column) => column.id === id)?.name ?? "";
  const positionOf = (id: UniqueIdentifier) =>
    columns.findIndex((column) => column.id === id) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Coluna ${nameOf(active.id)} selecionada.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Coluna ${nameOf(active.id)} na posição ${positionOf(over.id)} de ${columns.length}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Coluna ${nameOf(active.id)} solta na posição ${positionOf(over.id)}.`
        : undefined,
    onDragCancel: ({ active }) =>
      `Movimento da coluna ${nameOf(active.id)} cancelado.`,
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (over && active.id !== over.id) {
      move(String(active.id), positionOf(over.id) - 1);
    }
  };

  const cardDialog = (
    <Suspense fallback={null}>
      <CardDialogHost
        workspaceId={workspaceId}
        boardId={boardId}
        columns={columns}
        onMoveCard={moveCard}
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
            className="h-full w-[312px] shrink-0 rounded-xl bg-zinc-200 sm:w-72"
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      id="board-columns"
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={({ active }) => {
        setActiveId(active.id);
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
      }}
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
              index={index}
              total={columns.length}
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
      <DragOverlay dropAnimation={null} modifiers={[horizontalOnly]}>
        {activeId === null ? null : (
          <ColumnPreview
            name={nameOf(activeId)}
            cardCount={
              columns.find(({ id }) => id === activeId)?.cards.length ?? 0
            }
          />
        )}
      </DragOverlay>
      {cardDialog}
    </DndContext>
  );
}
