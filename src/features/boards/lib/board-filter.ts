import { isDueThisWeek, isOverdue } from "@/features/boards/lib/card-due";

export const NO_ASSIGNEE = "none";

export const DUE_FILTERS = ["overdue", "week", "none"] as const;

export type DueFilter = (typeof DUE_FILTERS)[number];

const LABELS_PARAM = "labels";
const ASSIGNEE_PARAM = "assignee";
const DUE_PARAM = "due";

export type BoardFilter = {
  labelIds: string[];
  assignee: string | null;
  due: DueFilter | null;
};

export type FilterableCard = {
  id: string;
  assigneeId: string | null;
  labelIds: string[];
  dueOn: string | null;
  completed: boolean;
};

export type FilterSnapshot = {
  key: string;
  shown: ReadonlySet<string>;
};

type ReadableParams = { get: (name: string) => string | null };

export const NO_FILTER: BoardFilter = {
  labelIds: [],
  assignee: null,
  due: null,
};

function isDueFilter(value: string | null): value is DueFilter {
  return DUE_FILTERS.some((filter) => filter === value);
}

export function parseBoardFilter(
  params: ReadableParams,
  labelIds: readonly string[],
  memberIds: readonly string[],
): BoardFilter {
  const knownLabels = new Set(labelIds);
  const requested = (params.get(LABELS_PARAM) ?? "").split(",");
  const assignee = params.get(ASSIGNEE_PARAM);
  const due = params.get(DUE_PARAM);
  return {
    labelIds: [...new Set(requested.filter((id) => knownLabels.has(id)))],
    assignee:
      assignee === NO_ASSIGNEE ||
      (assignee !== null && memberIds.includes(assignee))
        ? assignee
        : null,
    due: isDueFilter(due) ? due : null,
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
  if (filter.due === null) {
    params.delete(DUE_PARAM);
  } else {
    params.set(DUE_PARAM, filter.due);
  }
}

export function activeFilterCount(filter: BoardFilter) {
  return (
    filter.labelIds.length +
    (filter.assignee === null ? 0 : 1) +
    (filter.due === null ? 0 : 1)
  );
}

export function isFilterActive(filter: BoardFilter) {
  return activeFilterCount(filter) > 0;
}

function matchesAssignee(card: FilterableCard, assignee: string | null) {
  if (assignee === null) {
    return true;
  }
  return assignee === NO_ASSIGNEE
    ? card.assigneeId === null
    : card.assigneeId === assignee;
}

function matchesDue(
  card: FilterableCard,
  due: DueFilter | null,
  today: string | null,
) {
  if (due === null) {
    return true;
  }
  if (due === "none") {
    return card.dueOn === null;
  }
  if (today === null) {
    return true;
  }
  return due === "overdue"
    ? isOverdue(card, today)
    : isDueThisWeek(card, today);
}

export function matchesFilter(
  card: FilterableCard,
  filter: BoardFilter,
  today: string | null,
) {
  const hasLabel =
    filter.labelIds.length === 0 ||
    card.labelIds.some((id) => filter.labelIds.includes(id));
  return (
    hasLabel &&
    matchesAssignee(card, filter.assignee) &&
    matchesDue(card, filter.due, today)
  );
}

export function filterKey(filter: BoardFilter, today: string | null) {
  return [
    filter.labelIds.toSorted().join(","),
    filter.assignee ?? "",
    filter.due ?? "",
    filter.due === null || filter.due === "none" ? "" : (today ?? ""),
  ].join("|");
}

export function takeFilterSnapshot(
  cards: readonly FilterableCard[],
  filter: BoardFilter,
  today: string | null,
): FilterSnapshot {
  return {
    key: filterKey(filter, today),
    shown: new Set(
      cards
        .filter((card) => matchesFilter(card, filter, today))
        .map(({ id }) => id),
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
  today: string | null,
) {
  return snapshot.shown.has(card.id) || matchesFilter(card, filter, today);
}
