import type { CardComment } from "@/features/boards/lib/card-comment";

export function newestFirst(comments: CardComment[]) {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  return [...byId.values()].toSorted((a, b) => (a.id < b.id ? 1 : -1));
}

export function withPage(
  current: CardComment[],
  page: CardComment[],
  removed: ReadonlySet<string>,
) {
  const known = new Set(current.map((comment) => comment.id));
  const fresh = page.filter(
    (comment) => !known.has(comment.id) && !removed.has(comment.id),
  );
  return newestFirst([...current, ...fresh]);
}
