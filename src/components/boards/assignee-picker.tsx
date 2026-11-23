"use client";

import { ChevronDown } from "lucide-react";
import { setCardAssigneeAction } from "@/app/(app)/w/[slug]/b/card-actions";
import { useBoardMeta } from "@/components/boards/board-meta";
import { MemberAvatar } from "@/components/boards/member-avatar";
import type {
  BoardCard,
  CardUpdate,
} from "@/components/boards/use-board-columns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NO_ASSIGNEE = "none";
const NO_ASSIGNEE_LABEL = "Sem responsável";
const ASSIGN_FAILED = "Não foi possível alterar o responsável. Tente de novo.";
const ITEM = "h-11 cursor-pointer gap-2 px-2 pr-8 sm:h-9";

type AssigneePickerProps = {
  workspaceId: string;
  boardId: string;
  card: BoardCard;
  onUpdateCard: (update: CardUpdate) => void;
};

export function AssigneePicker({
  workspaceId,
  boardId,
  card,
  onUpdateCard,
}: AssigneePickerProps) {
  const { members } = useBoardMeta();
  const assignee = members.find(({ id }) => id === card.assigneeId);

  const assign = (assigneeId: string | null) => {
    if (assigneeId === (assignee?.id ?? null)) {
      return;
    }
    onUpdateCard({
      cardId: card.id,
      change: (current) => ({ ...current, assigneeId }),
      write: async () =>
        setCardAssigneeAction(workspaceId, boardId, card.id, { assigneeId }),
      failure: ASSIGN_FAILED,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Responsável: ${assignee?.name ?? "ninguém"}. Alterar`}
        className="inline-flex h-11 w-full max-w-full cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 pr-2.5 pl-2 text-sm font-[450] outline-hidden transition-colors duration-150 hover:bg-zinc-100 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-indigo-300 data-popup-open:bg-indigo-50 motion-reduce:transition-none sm:h-8 sm:w-fit sm:border-transparent sm:pr-2 sm:pl-1"
      >
        <MemberAvatar name={assignee?.name ?? null} />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            !assignee && "text-zinc-600",
          )}
        >
          {assignee?.name ?? NO_ASSIGNEE_LABEL}
        </span>
        <ChevronDown aria-hidden className="size-3.5 shrink-0 text-zinc-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[296px] w-[min(280px,calc(100vw-3rem))] overflow-y-auto p-1"
      >
        <DropdownMenuRadioGroup value={assignee?.id ?? NO_ASSIGNEE}>
          <DropdownMenuRadioItem
            value={NO_ASSIGNEE}
            closeOnClick
            className={ITEM}
            onClick={() => {
              assign(null);
            }}
          >
            <MemberAvatar name={null} />
            <span className="min-w-0 flex-1 truncate">{NO_ASSIGNEE_LABEL}</span>
          </DropdownMenuRadioItem>
          {members.map((member) => (
            <DropdownMenuRadioItem
              key={member.id}
              value={member.id}
              closeOnClick
              className={ITEM}
              onClick={() => {
                assign(member.id);
              }}
            >
              <MemberAvatar name={member.name} />
              <span className="min-w-0 flex-1 truncate">
                {member.name}
                {member.isViewer && (
                  <span className="text-zinc-600"> (você)</span>
                )}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
