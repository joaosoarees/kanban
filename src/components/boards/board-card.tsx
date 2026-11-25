import { AlignLeft } from "lucide-react";
import type { ComponentProps } from "react";
import { LabelTag } from "@/components/boards/label-tag";
import { MemberAvatar } from "@/components/boards/member-avatar";
import { useBoardMeta } from "@/features/boards/components/board-meta";
import type { BoardCard as BoardCardData } from "@/features/boards/components/use-board-columns";
import { cn } from "@/lib/utils";

const CARD =
  "flex min-h-12 w-full shrink-0 flex-col gap-2 rounded-lg border border-border bg-card px-3 py-[13px] text-left text-[15px]/5 shadow-xs sm:min-h-[42px] sm:py-2.5 sm:text-sm/5";

const VISIBLE_LABELS = 3;

function CardContent({ card }: { card: BoardCardData }) {
  const { labels, members } = useBoardMeta();
  const cardLabels = labels.filter(({ id }) => card.labelIds.includes(id));
  const assignee = members.find(({ id }) => id === card.assigneeId);
  const hiddenLabels = cardLabels.length - VISIBLE_LABELS;

  return (
    <>
      <span className="flex w-full items-start gap-2">
        <span className="line-clamp-3 min-w-0 flex-1 wrap-anywhere">
          {card.title}
        </span>
        {card.hasDescription && (
          <span className="relative flex h-5 shrink-0 items-center text-muted-foreground">
            <AlignLeft aria-hidden className="size-[15px]" />
            <span className="sr-only">Tem descrição</span>
          </span>
        )}
      </span>
      {(cardLabels.length > 0 || assignee !== undefined) && (
        <span className="flex w-full items-end justify-between gap-2">
          <span className="flex min-w-0 flex-wrap items-center gap-1">
            {cardLabels.slice(0, VISIBLE_LABELS).map(({ id, name, color }) => (
              <LabelTag key={id} name={name} color={color} />
            ))}
            {hiddenLabels > 0 && (
              <span className="relative inline-block h-[22px] rounded-[5px] bg-muted px-[7px] text-[13px]/[22px] font-medium text-fg-muted">
                <span aria-hidden>+{hiddenLabels}</span>
                <span className="sr-only">
                  {hiddenLabels === 1
                    ? "Mais 1 etiqueta"
                    : `Mais ${hiddenLabels} etiquetas`}
                </span>
              </span>
            )}
          </span>
          {assignee && (
            <span className="relative shrink-0">
              <MemberAvatar name={assignee.name} />
              <span className="sr-only">Responsável: {assignee.name}</span>
            </span>
          )}
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
        "cursor-pointer outline-hidden transition-colors duration-150 hover:border-border-control focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
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
        "rotate-[1.5deg] cursor-grabbing border-border-strong shadow-xl motion-reduce:rotate-0",
      )}
    >
      <CardContent card={card} />
    </div>
  );
}
