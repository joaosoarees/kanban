"use client";

import {
  closestCenter,
  closestCorners,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Active,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Over,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import type { BoardColumn } from "@/components/boards/use-board-columns";
import { locateCard, moveCardTo } from "@/lib/card-moves";

export type DragKind = "column" | "card";

export const COLUMN_DROP = "column-drop";

export const screenReaderInstructions = {
  draggable:
    "Pressione espaço para pegar, use as setas para mudar de lugar, espaço para soltar e Esc para cancelar.",
};

const boardCollision: CollisionDetection = (args) => {
  if (args.active.data.current?.type !== "card") {
    return closestCenter(args);
  }
  if (args.pointerCoordinates === null) {
    return closestCorners(args);
  }

  const columnHit = pointerWithin(args)
    .map(({ id }) => args.droppableContainers.find((item) => item.id === id))
    .find((item) => item?.data.current?.type === COLUMN_DROP);
  if (!columnHit) {
    return [];
  }

  const closestCard = closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      ({ data }) =>
        data.current?.type === "card" &&
        data.current.columnId === columnHit.data.current?.columnId,
    ),
  });
  return closestCard.length > 0 ? closestCard : [{ id: columnHit.id }];
};

function isBelow(active: Active, over: Over) {
  const translated = active.rect.current.translated;
  if (!translated) {
    return false;
  }
  return (
    translated.top + translated.height / 2 >
    over.rect.top + over.rect.height / 2
  );
}

function dropTarget(columns: BoardColumn[], active: Active, over: Over) {
  const overData = over.data.current;
  if (overData?.type === COLUMN_DROP) {
    const column = columns.find(({ id }) => id === overData.columnId);
    return column ? { columnId: column.id, index: column.cards.length } : null;
  }
  const location = locateCard(columns, String(over.id));
  if (!location) {
    return null;
  }
  return {
    columnId: location.column.id,
    index: location.index + (isBelow(active, over) ? 1 : 0),
  };
}

type UseBoardDragOptions = {
  columns: BoardColumn[];
  onMoveColumn: (columnId: string, targetIndex: number) => void;
  onCommitCard: (next: BoardColumn[], cardId: string, columnId: string) => void;
};

export function useBoardDrag({
  columns,
  onMoveColumn,
  onCommitCard,
}: UseBoardDragOptions) {
  const [activeDrag, setActiveDrag] = useState<{
    kind: DragKind;
    id: string;
  } | null>(null);
  const [draft, setDraft] = useState<BoardColumn[] | null>(null);
  const displayed = draft ?? columns;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: [KeyboardCode.Space],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space, KeyboardCode.Enter],
      },
    }),
  );

  const columnPosition = (id: UniqueIdentifier) =>
    displayed.findIndex((column) => column.id === id) + 1;

  const describeOver = (
    activeId: UniqueIdentifier,
    overId: UniqueIdentifier,
  ) => {
    const card = locateCard(displayed, String(activeId));
    if (card) {
      return `Card ${card.card.title} na coluna ${card.column.name}, posição ${card.index + 1} de ${card.column.cards.length}.`;
    }
    const name = displayed.find(({ id }) => id === activeId)?.name ?? "";
    return `Coluna ${name} na posição ${columnPosition(overId)} de ${displayed.length}.`;
  };

  const nameOf = (id: UniqueIdentifier) => {
    const card = locateCard(displayed, String(id));
    return card
      ? `Card ${card.card.title}`
      : `Coluna ${displayed.find((column) => column.id === id)?.name ?? ""}`;
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `${nameOf(active.id)} selecionado.`,
    onDragOver: ({ active, over }) =>
      over ? describeOver(active.id, over.id) : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `Solto. ${describeOver(active.id, over.id)}` : undefined,
    onDragCancel: ({ active }) =>
      `Movimento de ${nameOf(active.id)} cancelado.`,
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveDrag({
      kind: active.data.current?.type === "card" ? "card" : "column",
      id: String(active.id),
    });
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (activeDrag?.kind !== "card" || !over) {
      return;
    }
    const origin = locateCard(displayed, activeDrag.id);
    const target = dropTarget(displayed, active, over);
    if (!origin || !target || origin.column.id === target.columnId) {
      return;
    }
    const next = moveCardTo(
      displayed,
      activeDrag.id,
      target.columnId,
      target.index,
    );
    if (next !== null) {
      setDraft(next);
    }
  };

  const finishCardDrag = (cardId: string, over: Over | null) => {
    const overLocation =
      over && over.data.current?.type !== COLUMN_DROP
        ? locateCard(displayed, String(over.id))
        : null;
    const origin = locateCard(displayed, cardId);
    const reordered =
      overLocation && origin?.column.id === overLocation.column.id
        ? moveCardTo(displayed, cardId, origin.column.id, overLocation.index)
        : null;
    const final = reordered ?? displayed;
    const before = locateCard(columns, cardId);
    const after = locateCard(final, cardId);
    if (
      before &&
      after &&
      (before.column.id !== after.column.id || before.index !== after.index)
    ) {
      onCommitCard(final, cardId, after.column.id);
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (activeDrag?.kind === "card") {
      finishCardDrag(activeDrag.id, over);
    } else if (over && active.id !== over.id) {
      onMoveColumn(String(active.id), columnPosition(over.id) - 1);
    }
    setActiveDrag(null);
    setDraft(null);
  };

  const onDragCancel = () => {
    setActiveDrag(null);
    setDraft(null);
  };

  return {
    activeDrag,
    displayed,
    sensors,
    announcements,
    collisionDetection: boardCollision,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
  };
}
