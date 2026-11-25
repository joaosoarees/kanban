import type { KeyboardCoordinateGetter } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export const COLUMN_DROP = "column-drop";

const COLUMN_HEADER_HEIGHT = 44;
const ARROWS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

type Rect = { top: number; left: number; width: number };

export type DropTarget = {
  type: unknown;
  columnId: unknown;
  rect: Rect | undefined;
};

export function cardCoordinates(
  code: string,
  columnId: unknown,
  collisionRect: Rect,
  targets: DropTarget[],
) {
  const cardTops = (ownerId: unknown) =>
    targets
      .filter((target) => target.type === "card" && target.columnId === ownerId)
      .flatMap(({ rect }) => rect?.top ?? [])
      .toSorted((first, second) => first - second);

  if (code === "ArrowUp" || code === "ArrowDown") {
    const tops = cardTops(columnId);
    const top =
      code === "ArrowDown"
        ? tops.find((value) => value > collisionRect.top + 1)
        : tops.findLast((value) => value < collisionRect.top - 1);
    return top === undefined ? null : { x: collisionRect.left, y: top };
  }

  const columns = targets
    .filter(({ type }) => type === COLUMN_DROP)
    .flatMap(({ columnId: id, rect }) => (rect ? [{ id, rect }] : []))
    .toSorted((first, second) => first.rect.left - second.rect.left);
  const currentIndex = columns.findIndex(({ id }) => id === columnId);
  const step = code === "ArrowRight" ? 1 : -1;
  const target = columns.at(currentIndex + step);
  if (currentIndex === -1 || currentIndex + step < 0 || !target) {
    return null;
  }

  return {
    x: target.rect.left + (target.rect.width - collisionRect.width) / 2,
    y: cardTops(target.id).at(0) ?? target.rect.top + COLUMN_HEADER_HEIGHT,
  };
}

export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  args,
) => {
  const activeData = args.context.active?.data.current;
  if (activeData?.type !== "card") {
    return sortableKeyboardCoordinates(event, args);
  }
  if (!ARROWS.has(event.code)) {
    return;
  }
  event.preventDefault();
  const { collisionRect, droppableContainers, droppableRects } = args.context;
  if (!collisionRect) {
    return;
  }
  const targets = droppableContainers
    .getEnabled()
    .map(({ id, data }): DropTarget => {
      const current: Record<string, unknown> | undefined = data.current;
      return {
        type: current?.type,
        columnId: current?.columnId,
        rect: droppableRects.get(id),
      };
    });
  const coordinates = cardCoordinates(
    event.code,
    activeData.columnId,
    collisionRect,
    targets,
  );
  return coordinates ?? undefined;
};
