"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { unstable_rethrow } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { moveCardAction } from "@/app/(app)/w/[slug]/b/card-actions";
import { moveColumnAction } from "@/features/boards/column-actions";
import type { ActionResult } from "@/lib/action-result";
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
      try {
        const result = await write();
        if (result.status === "error" && result.gone !== true) {
          toast.error(result.message);
        }
      } catch (error) {
        unstable_rethrow(error);
        console.error(error);
        toast.error(failure);
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

  return { columns, move, moveCard, commitCardMove, updateCard };
}
