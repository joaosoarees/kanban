"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useBoardMeta } from "@/features/boards/components/board/board-meta";
import { useToday } from "@/features/boards/hooks/use-today";
import type {
  BoardCard,
  BoardColumn,
} from "@/features/boards/hooks/use-board-columns";
import {
  filterKey,
  isCardVisible,
  isFilterActive,
  parseBoardFilter,
  revealCard,
  takeFilterSnapshot,
  writeBoardFilter,
  type BoardFilter,
} from "@/features/boards/lib/board-filter";

export function useBoardFilter() {
  const params = useSearchParams();
  const { labels, members } = useBoardMeta();
  return parseBoardFilter(
    params,
    labels.map(({ id }) => id),
    members.map(({ id }) => id),
  );
}

export function replaceBoardFilter(filter: BoardFilter) {
  const url = new URL(window.location.href);
  writeBoardFilter(url.searchParams, filter);
  window.history.replaceState(null, "", url);
}

export function useVisibleCards(columns: BoardColumn[], filter: BoardFilter) {
  const today = useToday();
  const [snapshot, setSnapshot] = useState(() =>
    takeFilterSnapshot(
      columns.flatMap(({ cards }) => cards),
      filter,
      today,
    ),
  );
  let current = snapshot;
  if (snapshot.key !== filterKey(filter, today)) {
    current = takeFilterSnapshot(
      columns.flatMap(({ cards }) => cards),
      filter,
      today,
    );
    setSnapshot(current);
  }

  const reveal = (cardId: string) => {
    setSnapshot((latest) => revealCard(latest, cardId));
  };
  const cardsOf = isFilterActive(filter)
    ? (column: BoardColumn): BoardCard[] =>
        column.cards.filter((card) =>
          isCardVisible(card, filter, current, today),
        )
    : null;
  return { cardsOf, reveal };
}
