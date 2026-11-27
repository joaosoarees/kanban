"use client";

import { CheckBox } from "@/components/check-box";
import type {
  BoardCard,
  CardUpdate,
} from "@/features/boards/hooks/use-board-columns";
import { setCardCompletionAction } from "@/features/boards/server/card-due-actions";

const COMPLETION_FAILED =
  "Não foi possível marcar o card. Desfizemos a mudança. Tente de novo.";

type CompletionToggleProps = {
  workspaceId: string;
  boardId: string;
  card: BoardCard;
  onUpdateCard: (update: CardUpdate) => void;
};

export function CompletionToggle({
  workspaceId,
  boardId,
  card,
  onUpdateCard,
}: CompletionToggleProps) {
  const toggle = () => {
    const completed = !card.completed;
    onUpdateCard({
      cardId: card.id,
      change: (current) => ({ ...current, completed }),
      write: async () =>
        setCardCompletionAction(workspaceId, boardId, card.id, { completed }),
      failure: COMPLETION_FAILED,
    });
  };

  return (
    <label className="inline-flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-md border border-border px-2.5 text-sm font-[450] transition-colors duration-150 hover:bg-muted has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 motion-reduce:transition-none sm:h-8 sm:w-fit sm:border-transparent sm:px-1.5">
      <input
        type="checkbox"
        checked={card.completed}
        onChange={toggle}
        className="sr-only"
      />
      <CheckBox checked={card.completed} />
      Concluído
    </label>
  );
}
