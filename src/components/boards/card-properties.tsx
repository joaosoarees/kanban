import { AssigneePicker } from "@/components/boards/assignee-picker";
import type {
  BoardCard,
  CardUpdate,
} from "@/components/boards/use-board-columns";

const PROPERTY_LABEL =
  "h-[22px] text-[13px]/[22px] font-medium text-zinc-600 sm:h-8 sm:text-[13px]/8";

type CardPropertiesProps = {
  workspaceId: string;
  boardId: string;
  card: BoardCard;
  onUpdateCard: (update: CardUpdate) => void;
};

export function CardProperties({
  workspaceId,
  boardId,
  card,
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
    </div>
  );
}
