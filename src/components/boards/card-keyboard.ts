import type {
  DroppableContainer,
  KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export const COLUMN_DROP = "column-drop";

const COLUMN_HEADER_HEIGHT = 44;
const ARROWS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

type GetterArgs = Parameters<KeyboardCoordinateGetter>[1];

function cardCoordinates(
  code: string,
  columnId: unknown,
  { collisionRect, droppableContainers, droppableRects }: GetterArgs["context"],
) {
  if (!collisionRect) {
    return null;
  }

  const enabled = droppableContainers.getEnabled();
  const rectOf = ({ id }: DroppableContainer) => droppableRects.get(id);
  const cardTops = (ownerId: unknown) =>
    enabled
      .filter(
        ({ data }) =>
          data.current?.type === "card" && data.current.columnId === ownerId,
      )
      .flatMap((item) => rectOf(item)?.top ?? [])
      .toSorted((first, second) => first - second);

  if (code === "ArrowUp" || code === "ArrowDown") {
    const tops = cardTops(columnId);
    const top =
      code === "ArrowDown"
        ? tops.find((value) => value > collisionRect.top + 1)
        : tops.findLast((value) => value < collisionRect.top - 1);
    return top === undefined ? null : { x: collisionRect.left, y: top };
  }

  const columns = enabled
    .filter(({ data }) => data.current?.type === COLUMN_DROP)
    .flatMap((item) => {
      const rect = rectOf(item);
      return rect ? [{ item, rect }] : [];
    })
    .toSorted((first, second) => first.rect.left - second.rect.left);
  const currentIndex = columns.findIndex(
    ({ item }) => item.data.current?.columnId === columnId,
  );
  const step = code === "ArrowRight" ? 1 : -1;
  const target = columns.at(currentIndex + step);
  if (currentIndex === -1 || currentIndex + step < 0 || !target) {
    return null;
  }

  return {
    x: target.rect.left + (target.rect.width - collisionRect.width) / 2,
    y:
      cardTops(target.item.data.current?.columnId).at(0) ??
      target.rect.top + COLUMN_HEADER_HEIGHT,
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
  const coordinates = cardCoordinates(
    event.code,
    activeData.columnId,
    args.context,
  );
  return coordinates ?? undefined;
};
