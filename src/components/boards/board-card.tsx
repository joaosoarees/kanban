import { AlignLeft } from "lucide-react";
import type { ComponentProps } from "react";
import type { BoardCard as BoardCardData } from "@/components/boards/use-board-columns";
import { cn } from "@/lib/utils";

const CARD =
  "flex min-h-12 w-full shrink-0 items-start gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-[13px] text-left text-[15px]/5 shadow-xs sm:min-h-[42px] sm:py-2.5 sm:text-sm/5";

function CardContent({ card }: { card: BoardCardData }) {
  return (
    <>
      <span className="line-clamp-3 min-w-0 flex-1 wrap-anywhere">
        {card.title}
      </span>
      {card.hasDescription && (
        <span className="flex h-5 shrink-0 items-center text-zinc-500">
          <AlignLeft aria-hidden className="size-[15px]" />
          <span className="sr-only">Tem descrição</span>
        </span>
      )}
    </>
  );
}

type BoardCardButtonProps = ComponentProps<"button"> & {
  card: BoardCardData;
};

export function BoardCardButton({
  card,
  className,
  ...props
}: BoardCardButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        CARD,
        "cursor-pointer outline-hidden transition-colors duration-150 hover:border-zinc-400 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <CardContent card={card} />
    </button>
  );
}

export function BoardCardPreview({ card }: { card: BoardCardData }) {
  return (
    <div
      className={cn(
        CARD,
        "rotate-[1.5deg] cursor-grabbing border-zinc-300 shadow-xl motion-reduce:rotate-0",
      )}
    >
      <CardContent card={card} />
    </div>
  );
}
