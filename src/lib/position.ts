import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

export type Positioned = { id: string; position: string };

export function initialPositions(count: number): string[] {
  return generateNKeysBetween(null, null, count);
}

export function positionAtEnd(ordered: Positioned[]): string {
  return generateKeyBetween(ordered.at(-1)?.position ?? null, null);
}

function insertionIndex(others: Positioned[], previousId: string | null) {
  if (previousId === null) {
    return 0;
  }
  const previousIndex = others.findIndex(({ id }) => id === previousId);
  return previousIndex === -1 ? null : previousIndex + 1;
}

export function positionInColumn(
  ordered: Positioned[],
  movedId: string,
  previousId: string | null,
): string | null {
  const others = ordered.filter(({ id }) => id !== movedId);
  const insertAt = insertionIndex(others, previousId);
  if (insertAt === null) {
    return null;
  }

  const before = insertAt > 0 ? others[insertAt - 1].position : null;
  const after = insertAt < others.length ? others[insertAt].position : null;
  return generateKeyBetween(before, after);
}

export function planMove(
  ordered: Positioned[],
  movedId: string,
  previousId: string | null,
): Positioned[] | null {
  const others = ordered.filter(({ id }) => id !== movedId);
  if (others.length === ordered.length) {
    return null;
  }

  const insertAt = insertionIndex(others, previousId);
  if (insertAt === null) {
    return null;
  }

  const before = insertAt > 0 ? others[insertAt - 1].position : null;
  const after = insertAt < others.length ? others[insertAt].position : null;

  if (before === null || after === null || before < after) {
    return [{ id: movedId, position: generateKeyBetween(before, after) }];
  }

  const ids = others.map(({ id }) => id);
  ids.splice(insertAt, 0, movedId);
  const positions = initialPositions(ids.length);
  return ids.map((id, index) => ({ id, position: positions[index] }));
}
