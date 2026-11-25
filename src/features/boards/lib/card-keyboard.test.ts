import { describe, expect, it } from "vitest";
import { cardCoordinates, COLUMN_DROP, type DropTarget } from "./card-keyboard";

const COLUMN_WIDTH = 288;
const CARD_WIDTH = 272;
const HEADER = 44;

function column(columnId: string, left: number): DropTarget {
  return {
    type: COLUMN_DROP,
    columnId,
    rect: { top: 100, left, width: COLUMN_WIDTH },
  };
}

function card(columnId: string, left: number, top: number) {
  return {
    type: "card",
    columnId,
    rect: { top, left: left + 8, width: CARD_WIDTH },
  };
}

const todo = column("todo", 0);
const doing = column("doing", 300);
const done = column("done", 600);
const first = card("todo", 0, 144);
const second = card("todo", 0, 214);
const third = card("todo", 0, 284);
const inProgress = card("doing", 300, 144);
const board = [todo, doing, done, third, first, inProgress, second];

describe("cardCoordinates", () => {
  it("should move down to the next card in the same column", () => {
    const target = cardCoordinates("ArrowDown", "todo", first.rect, board);

    expect(target).toEqual({ x: first.rect.left, y: second.rect.top });
  });

  it("should move up to the previous card in the same column", () => {
    const target = cardCoordinates("ArrowUp", "todo", third.rect, board);

    expect(target).toEqual({ x: third.rect.left, y: second.rect.top });
  });

  it("should stay put at the bottom of a column", () => {
    const target = cardCoordinates("ArrowDown", "todo", third.rect, board);

    expect(target).toBeNull();
  });

  it("should move right to the first card of the next column, centred", () => {
    const target = cardCoordinates("ArrowRight", "todo", second.rect, board);

    expect(target).toEqual({
      x: 300 + (COLUMN_WIDTH - CARD_WIDTH) / 2,
      y: inProgress.rect.top,
    });
  });

  it("should move into an empty column just below its header", () => {
    const target = cardCoordinates(
      "ArrowRight",
      "doing",
      inProgress.rect,
      board,
    );

    expect(target).toEqual({
      x: 600 + (COLUMN_WIDTH - CARD_WIDTH) / 2,
      y: 100 + HEADER,
    });
  });

  it("should stay put when moving left from the first column", () => {
    const target = cardCoordinates("ArrowLeft", "todo", first.rect, board);

    expect(target).toBeNull();
  });

  it("should stay put when moving right from the last column", () => {
    const target = cardCoordinates("ArrowRight", "done", first.rect, board);

    expect(target).toBeNull();
  });
});
