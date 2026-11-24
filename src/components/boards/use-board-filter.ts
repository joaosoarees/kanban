"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useBoardMeta } from "@/components/boards/board-meta";
import type {
  BoardCard,
  BoardColumn,
} from "@/components/boards/use-board-columns";
import {
  filterKey,
  isCardVisible,
  isFilterActive,
  parseBoardFilter,
  takeFilterSnapshot,
  writeBoardFilter,
  type BoardFilter,
} from "@/lib/board-filter";

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

export function useVisibleCards(
  columns: BoardColumn[],
  filter: BoardFilter,
): ((column: BoardColumn) => BoardCard[]) | null {
  const [snapshot, setSnapshot] = useState(() =>
    takeFilterSnapshot(
      columns.flatMap(({ cards }) => cards),
      filter,
    ),
  );
  let current = snapshot;
  if (snapshot.key !== filterKey(filter)) {
    current = takeFilterSnapshot(
      columns.flatMap(({ cards }) => cards),
      filter,
    );
    setSnapshot(current);
  }

  if (!isFilterActive(filter)) {
    return null;
  }
  return (column) =>
    column.cards.filter((card) => isCardVisible(card, filter, current));
}
