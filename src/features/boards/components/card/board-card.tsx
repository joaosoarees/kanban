import { AlignLeft, ListChecks, MessageSquare } from "lucide-react";
import type { ComponentProps } from "react";
import { useBoardMeta } from "@/features/boards/components/board/board-meta";
import { DueBadge } from "@/features/boards/components/card/due-badge";
import { MemberAvatar } from "@/features/boards/components/card/member-avatar";
import { LabelTag } from "@/features/boards/components/label/label-tag";
import type { BoardCard as BoardCardData } from "@/features/boards/hooks/use-board-columns";
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
      {(cardLabels.length > 0 ||
        assignee !== undefined ||
        card.commentCount > 0 ||
        card.checklistTotal > 0 ||
        card.dueOn !== null ||
        card.completed) && (
        <span className="flex w-full items-end justify-between gap-2">
          <span className="flex min-w-0 flex-wrap items-center gap-1">
            <DueBadge card={card} />
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
          <span className="flex shrink-0 items-center gap-2">
            {card.checklistTotal > 0 && (
              <span
                className={cn(
                  "relative flex h-[22px] items-center gap-[3px] text-xs font-medium tabular-nums",
                  card.checklistDone === card.checklistTotal
                    ? "rounded-[5px] bg-success-bg pr-1.5 pl-[5px] text-success-fg"
                    : "text-fg-muted",
                )}
              >
                <ListChecks aria-hidden className="size-3.5" />
                <span aria-hidden>
                  {card.checklistDone}/{card.checklistTotal}
                </span>
                <span className="sr-only">
                  {card.checklistDone} de {card.checklistTotal} itens concluídos
                </span>
              </span>
            )}
            {card.commentCount > 0 && (
              <span className="relative flex h-[22px] items-center gap-[3px] text-xs font-medium text-fg-muted">
                <MessageSquare aria-hidden className="size-3.5" />
                <span aria-hidden>{card.commentCount}</span>
                <span className="sr-only">
                  {card.commentCount === 1
                    ? "1 comentário"
                    : `${card.commentCount} comentários`}
                </span>
              </span>
            )}
            {assignee && (
              <span className="relative shrink-0">
                <MemberAvatar name={assignee.name} />
                <span className="sr-only">Responsável: {assignee.name}</span>
              </span>
            )}
          </span>
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
