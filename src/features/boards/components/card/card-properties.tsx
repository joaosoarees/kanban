import { AssigneePicker } from "@/features/boards/components/card/assignee-picker";
import { CompletionToggle } from "@/features/boards/components/card/completion-toggle";
import { LabelPicker } from "@/features/boards/components/label/label-picker";
import type {
  BoardCard,
  BoardColumn,
  CardUpdate,
} from "@/features/boards/hooks/use-board-columns";
import { cn } from "@/lib/utils";

const PROPERTY_LABEL =
  "h-[22px] text-[13px]/[22px] font-medium text-fg-muted sm:h-8 sm:text-[13px]/8";

type CardPropertiesProps = {
  workspaceId: string;
  boardId: string;
  card: BoardCard;
  columns: BoardColumn[];
  onUpdateCard: (update: CardUpdate) => void;
};

export function CardProperties({
  workspaceId,
  boardId,
  card,
  columns,
  onUpdateCard,
}: CardPropertiesProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-y-1 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-x-2 sm:gap-y-1.5">
      <span className={PROPERTY_LABEL}>Responsável</span>
      <AssigneePicker
        workspaceId={workspaceId}
        boardId={boardId}
        card={card}
        onUpdateCard={onUpdateCard}
      />
      <span aria-hidden className="max-sm:hidden" />
      <div className="mt-2 sm:mt-0">
        <CompletionToggle
          workspaceId={workspaceId}
          boardId={boardId}
          card={card}
          onUpdateCard={onUpdateCard}
        />
      </div>
      <span className={cn(PROPERTY_LABEL, "mt-1.5 sm:mt-0")}>Etiquetas</span>
      <LabelPicker
        workspaceId={workspaceId}
        boardId={boardId}
        card={card}
        columns={columns}
        onUpdateCard={onUpdateCard}
      />
    </div>
  );
}
