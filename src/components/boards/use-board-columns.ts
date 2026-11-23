"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { unstable_rethrow } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { moveCardAction } from "@/app/(app)/w/[slug]/b/card-actions";
import { moveColumnAction } from "@/app/(app)/w/[slug]/b/column-actions";
import { moveCardTo, previousCardIdOf } from "@/lib/card-moves";

export type BoardCard = {
  id: string;
  title: string;
  hasDescription: boolean;
  assigneeId: string | null;
  labelIds: string[];
};

export type BoardColumn = {
  id: string;
  name: string;
  cards: BoardCard[];
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
    (_current, next: BoardColumn[]) => next,
  );
  const [, startTransition] = useTransition();

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
      try {
        const result = await moveColumnAction(workspaceId, boardId, {
          columnId,
          previousColumnId,
        });
        if (result.status === "error") {
          toast.error(result.message);
        }
      } catch (error) {
        unstable_rethrow(error);
        console.error(error);
        toast.error(MOVE_FAILED);
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
      try {
        const result = await moveCardAction(workspaceId, boardId, {
          cardId,
          columnId,
          previousCardId,
        });
        if (result.status === "error") {
          toast.error(result.message);
        }
      } catch (error) {
        unstable_rethrow(error);
        console.error(error);
        toast.error(CARD_MOVE_FAILED);
      }
    });
  };

  const moveCard = (cardId: string, columnId: string, index: number) => {
    const next = moveCardTo(columns, cardId, columnId, index);
    if (next !== null) {
      commitCardMove(next, cardId, columnId);
    }
  };

  return { columns, move, moveCard, commitCardMove };
}
