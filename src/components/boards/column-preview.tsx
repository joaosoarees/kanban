import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export const COLUMN_SHELL =
  "flex h-full w-[312px] shrink-0 snap-center flex-col rounded-xl bg-zinc-100 p-2 sm:w-72";

export function cardCountLabel(count: number) {
  if (count === 0) {
    return "Sem cards";
  }
  return count === 1 ? "1 card" : `${count} cards`;
}

export function ColumnPreview({
  name,
  cardCount,
}: {
  name: string;
  cardCount: number;
}) {
  return (
    <div
      className={cn(
        COLUMN_SHELL,
        "rotate-[1.5deg] cursor-grabbing shadow-xl motion-reduce:rotate-0",
      )}
    >
      <div className="flex h-10 items-center gap-1">
        <span className="flex h-8 w-5 items-center justify-center text-zinc-500">
          <GripVertical aria-hidden className="size-[15px]" />
        </span>
        <span className="truncate px-2 text-sm font-semibold">{name}</span>
      </div>
      <p className="mt-1 h-6 px-2 text-[13px]/6 text-zinc-600">
        {cardCountLabel(cardCount)}
      </p>
    </div>
  );
}
