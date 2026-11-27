"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { moveCardTo, previousCardIdOf } from "@/features/boards/lib/card-moves";
import { moveCardAction } from "@/features/boards/server/card-move-actions";
import { moveColumnAction } from "@/features/boards/server/column-actions";
import type { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/run-action";

export type BoardCard = {
  id: string;
  title: string;
  hasDescription: boolean;
  assigneeId: string | null;
  labelIds: string[];
  dueOn: string | null;
  completed: boolean;
  commentCount: number;
  checklistTotal: number;
  checklistDone: number;
};

export type BoardColumn = {
  id: string;
  name: string;
  cards: BoardCard[];
};

type ColumnsUpdate =
  BoardColumn[] | ((current: BoardColumn[]) => BoardColumn[]);

export type CardUpdate = {
  cardId: string;
  change: (card: BoardCard) => BoardCard;
  write: () => Promise<ActionResult>;
  failure: string;
};

const MOVE_FAILED = "Não foi possível mover a coluna. Tente de novo.";
const CARD_MOVE_FAILED =
  "Não foi possível mover o card. Desfizemos o movimento. Tente de novo.";

export function useBoardColumns(
  workspaceId: string,
  boardId: string,
  serverColumns: BoardColumn[],
) {
  const [columns, setOptimisticColumns] = useOptimistic(
    serverColumns,
    (current, update: ColumnsUpdate) =>
      typeof update === "function" ? update(current) : update,
  );
  const [, startTransition] = useTransition();

  const updateCard = ({ cardId, change, write, failure }: CardUpdate) => {
    startTransition(async () => {
      setOptimisticColumns((current) =>
        current.map((column) => ({
          id: column.id,
          name: column.name,
          cards: column.cards.map((card) =>
            card.id === cardId ? change(card) : card,
          ),
        })),
      );
      const result = await runAction(write, failure);
      if (result.status === "error" && result.gone !== true) {
        toast.error(result.message);
      }
    });
  };

  const move = (columnId: string, targetIndex: number) => {
    const currentIndex = columns.findIndex(({ id }) => id === columnId);
    if (
      currentIndex === -1 ||
      currentIndex === targetIndex ||
      targetIndex < 0 ||
      targetIndex >= columns.length
    ) {
      return;
    }

    const next = arrayMove(columns, currentIndex, targetIndex);
    const previousColumnId =
      targetIndex === 0 ? null : next[targetIndex - 1].id;

    startTransition(async () => {
      setOptimisticColumns(next);
      const result = await runAction(
        async () =>
          moveColumnAction(workspaceId, boardId, {
            columnId,
            previousColumnId,
          }),
        MOVE_FAILED,
      );
      if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  const commitCardMove = (
    next: BoardColumn[],
    cardId: string,
    columnId: string,
  ) => {
    const previousCardId = previousCardIdOf(next, cardId);

    startTransition(async () => {
      setOptimisticColumns(next);
      const result = await runAction(
        async () =>
          moveCardAction(workspaceId, boardId, {
            cardId,
            columnId,
            previousCardId,
          }),
        CARD_MOVE_FAILED,
      );
      if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  const moveCard = (cardId: string, columnId: string, index: number) => {
    const next = moveCardTo(columns, cardId, columnId, index);
    if (next !== null) {
      commitCardMove(next, cardId, columnId);
    }
  };

  return { columns, move, moveCard, commitCardMove, updateCard };
}
