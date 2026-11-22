type ColumnLike = { id: string; cards: { id: string }[] };

export function locateCard<Column extends ColumnLike>(
  columns: Column[],
  cardId: string,
) {
  for (const column of columns) {
    const index = column.cards.findIndex(({ id }) => id === cardId);
    if (index !== -1) {
      const card: Column["cards"][number] = column.cards[index];
      return { column, card, index };
    }
  }
  return null;
}

export function moveCardTo<Column extends ColumnLike>(
  columns: Column[],
  cardId: string,
  columnId: string,
  targetIndex: number,
): Column[] | null {
  const origin = locateCard(columns, cardId);
  const target = columns.find(({ id }) => id === columnId);
  if (!origin || !target) {
    return null;
  }

  const remaining = target.cards.filter(({ id }) => id !== cardId);
  const index = Math.min(Math.max(targetIndex, 0), remaining.length);
  if (origin.column.id === columnId && origin.index === index) {
    return null;
  }

  const next = [...columns];
  next[columns.indexOf(origin.column)] = {
    ...origin.column,
    cards: origin.column.cards.filter(({ id }) => id !== cardId),
  };
  next[columns.indexOf(target)] = {
    ...target,
    cards: remaining.toSpliced(index, 0, origin.card),
  };
  return next;
}

export function previousCardIdOf(columns: ColumnLike[], cardId: string) {
  const location = locateCard(columns, cardId);
  if (!location || location.index === 0) {
    return null;
  }
  return location.column.cards[location.index - 1].id;
}
