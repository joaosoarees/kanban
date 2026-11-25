export const NO_ASSIGNEE = "none";

const LABELS_PARAM = "labels";
const ASSIGNEE_PARAM = "assignee";

export type BoardFilter = {
  labelIds: string[];
  assignee: string | null;
};

export type FilterableCard = {
  id: string;
  assigneeId: string | null;
  labelIds: string[];
};

export type FilterSnapshot = {
  key: string;
  shown: ReadonlySet<string>;
};

type ReadableParams = { get: (name: string) => string | null };

export const NO_FILTER: BoardFilter = { labelIds: [], assignee: null };

export function parseBoardFilter(
  params: ReadableParams,
  labelIds: readonly string[],
  memberIds: readonly string[],
): BoardFilter {
  const knownLabels = new Set(labelIds);
  const requested = (params.get(LABELS_PARAM) ?? "").split(",");
  const assignee = params.get(ASSIGNEE_PARAM);
  return {
    labelIds: [...new Set(requested.filter((id) => knownLabels.has(id)))],
    assignee:
      assignee === NO_ASSIGNEE ||
      (assignee !== null && memberIds.includes(assignee))
        ? assignee
        : null,
  };
}

export function writeBoardFilter(params: URLSearchParams, filter: BoardFilter) {
  if (filter.labelIds.length === 0) {
    params.delete(LABELS_PARAM);
  } else {
    params.set(LABELS_PARAM, filter.labelIds.join(","));
  }
  if (filter.assignee === null) {
    params.delete(ASSIGNEE_PARAM);
  } else {
    params.set(ASSIGNEE_PARAM, filter.assignee);
  }
}

export function activeFilterCount(filter: BoardFilter) {
  return filter.labelIds.length + (filter.assignee === null ? 0 : 1);
}

export function isFilterActive(filter: BoardFilter) {
  return activeFilterCount(filter) > 0;
}

export function matchesFilter(card: FilterableCard, filter: BoardFilter) {
  const hasLabel =
    filter.labelIds.length === 0 ||
    card.labelIds.some((id) => filter.labelIds.includes(id));
  if (!hasLabel || filter.assignee === null) {
    return hasLabel;
  }
  return filter.assignee === NO_ASSIGNEE
    ? card.assigneeId === null
    : card.assigneeId === filter.assignee;
}

export function filterKey(filter: BoardFilter) {
  return `${filter.labelIds.toSorted().join(",")}|${filter.assignee ?? ""}`;
}

export function takeFilterSnapshot(
  cards: readonly FilterableCard[],
  filter: BoardFilter,
): FilterSnapshot {
  return {
    key: filterKey(filter),
    shown: new Set(
      cards.filter((card) => matchesFilter(card, filter)).map(({ id }) => id),
    ),
  };
}

export function revealCard(
  snapshot: FilterSnapshot,
  cardId: string,
): FilterSnapshot {
  return { key: snapshot.key, shown: new Set(snapshot.shown).add(cardId) };
}

export function isCardVisible(
  card: FilterableCard,
  filter: BoardFilter,
  snapshot: FilterSnapshot,
) {
  return snapshot.shown.has(card.id) || matchesFilter(card, filter);
}
