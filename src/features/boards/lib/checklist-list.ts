import * as z from "zod";

export type ChecklistEntry = {
  id: string;
  text: string;
  completed: boolean;
};

export function previousIdOf(
  items: ChecklistEntry[],
  itemId: string,
): string | null | undefined {
  const index = items.findIndex(({ id }) => id === itemId);
  if (index === -1) {
    return undefined;
  }
  return index === 0 ? null : items[index - 1].id;
}

export function placeAfter(
  items: ChecklistEntry[],
  item: ChecklistEntry,
  previousId: string | null,
): ChecklistEntry[] {
  const rest = items.filter(({ id }) => id !== item.id);
  if (previousId === null) {
    return [item, ...rest];
  }
  const previousIndex = rest.findIndex(({ id }) => id === previousId);
  if (previousIndex === -1) {
    return [...rest, item];
  }
  return [
    ...rest.slice(0, previousIndex + 1),
    item,
    ...rest.slice(previousIndex + 1),
  ];
}

export function moveToIndex(
  items: ChecklistEntry[],
  itemId: string,
  index: number,
): { items: ChecklistEntry[]; previousId: string | null } | null {
  const item = items.find(({ id }) => id === itemId);
  if (item === undefined) {
    return null;
  }
  const rest = items.filter(({ id }) => id !== itemId);
  const target = Math.max(0, Math.min(index, rest.length));
  const previousId = target === 0 ? null : rest[target - 1].id;
  return { items: placeAfter(items, item, previousId), previousId };
}

export function countDone(items: ChecklistEntry[]) {
  return items.filter(({ completed }) => completed).length;
}

const entrySchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
});

export const checklistResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.array(entrySchema) }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);
