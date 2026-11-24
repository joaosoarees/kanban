import { GripVertical } from "lucide-react";
import { cardsLabel } from "@/lib/card-count";
import { cn } from "@/lib/utils";

export const COLUMN_SHELL =
  "flex h-full w-[312px] shrink-0 snap-center flex-col rounded-xl bg-muted p-2 sm:w-72";

export function cardCountLabel(count: number, visible: number | null = null) {
  if (visible !== null) {
    return `${visible} de ${cardsLabel(count)}`;
  }
  return count === 0 ? "Sem cards" : cardsLabel(count);
}

export function deleteColumnDescription(cardCount: number) {
  if (cardCount === 0) {
    return "A coluna será apagada para todo o workspace. Isso não pode ser desfeito.";
  }
  const cards = cardCount === 1 ? "seu card" : `seus ${cardCount} cards`;
  return `A coluna e ${cards} serão apagados para todo o workspace. Isso não pode ser desfeito.`;
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
        <span className="flex h-8 w-5 items-center justify-center text-muted-foreground">
          <GripVertical aria-hidden className="size-[15px]" />
        </span>
        <span className="truncate px-2 text-sm font-semibold">{name}</span>
      </div>
      <p className="mt-1 h-6 px-2 text-[13px]/6 text-fg-muted">
        {cardCountLabel(cardCount)}
      </p>
    </div>
  );
}
