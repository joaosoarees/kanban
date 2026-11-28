"use client";

import { Plus } from "lucide-react";
import { startTransition, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBoardMeta } from "@/features/boards/components/board/board-meta";
import {
  LABEL_COLORS,
  LabelEditor,
  type LabelDraft,
} from "@/features/boards/components/label/label-editor";
import { LabelList } from "@/features/boards/components/label/label-list";
import { LabelTag } from "@/features/boards/components/label/label-tag";
import type {
  BoardCard,
  BoardColumn,
  CardUpdate,
} from "@/features/boards/hooks/use-board-columns";
import { MAX_LABELS_PER_CARD } from "@/features/boards/lib/label-schemas";
import {
  addCardLabelAction,
  removeCardLabelAction,
} from "@/features/boards/server/card-label-actions";
import { deleteLabelAction } from "@/features/boards/server/label-actions";
import { cardsLabel } from "@/lib/card-count";

const TOGGLE_FAILED = "Não foi possível salvar a etiqueta. Tente de novo.";

type DeleteTarget = { id: string; name: string; cardCount: number };

function deleteDescription(cardCount: number) {
  if (cardCount === 0) {
    return "Ela não está em nenhum card. Isso não pode ser desfeito.";
  }
  return `Ela será removida de ${cardsLabel(cardCount)}. Isso não pode ser desfeito.`;
}

type LabelPickerProps = {
  workspaceId: string;
  boardId: string;
  card: BoardCard;
  columns: BoardColumn[];
  onUpdateCard: (update: CardUpdate) => void;
};

export function LabelPicker({
  workspaceId,
  boardId,
  card,
  columns,
  onUpdateCard,
}: LabelPickerProps) {
  const { labels } = useBoardMeta();
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<LabelDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const applied = labels.filter(({ id }) => card.labelIds.includes(id));
  const appliedIds = new Set(applied.map(({ id }) => id));

  const askToDelete = (labelId: string, name: string) => {
    setDeleteTarget({
      id: labelId,
      name,
      cardCount: columns
        .flatMap((column) => column.cards)
        .filter(({ labelIds }) => labelIds.includes(labelId)).length,
    });
    setIsDeleteOpen(true);
  };

  const toggle = (labelId: string) => {
    const isApplied = card.labelIds.includes(labelId);
    onUpdateCard({
      cardId: card.id,
      change: (current) => ({
        ...current,
        labelIds: isApplied
          ? current.labelIds.filter((id) => id !== labelId)
          : [...current.labelIds, labelId],
      }),
      write: async () =>
        isApplied
          ? removeCardLabelAction(workspaceId, boardId, card.id, labelId)
          : addCardLabelAction(workspaceId, boardId, card.id, labelId),
      failure: TOGGLE_FAILED,
    });
  };

  return (
    <div className="flex min-h-8 min-w-0 flex-wrap items-center gap-1 pb-1 sm:px-1 sm:pb-0">
      {applied.map(({ id, name, color }) => (
        <LabelTag key={id} name={name} color={color} />
      ))}
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          if (isBusy) {
            return;
          }
          setIsOpen(open);
          if (!open) {
            setQuery("");
            setDraft(null);
          }
        }}
      >
        <PopoverTrigger className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-1 rounded-[5px] border border-dashed border-border-control bg-card px-3 text-sm font-medium text-fg-secondary outline-hidden hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-6 sm:w-auto sm:px-[7px] sm:text-[13px]">
          <Plus aria-hidden className="size-3.5" />
          Etiqueta
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label="Etiquetas do card"
          className="w-(--anchor-width) gap-0 overflow-hidden p-0 sm:w-[300px]"
        >
          {draft === null ? (
            <LabelList
              labels={labels}
              appliedIds={appliedIds}
              query={query}
              onQueryChange={setQuery}
              onToggle={toggle}
              onEdit={setDraft}
              onCreate={(name) => {
                setDraft({
                  id: null,
                  name,
                  color: LABEL_COLORS[labels.length % LABEL_COLORS.length],
                });
              }}
            />
          ) : (
            <LabelEditor
              key={draft.id ?? "new"}
              workspaceId={workspaceId}
              boardId={boardId}
              draft={draft}
              onBusyChange={setIsBusy}
              onBack={() => {
                setDraft(null);
              }}
              onCreated={(labelId) => {
                setDraft(null);
                setQuery("");
                if (appliedIds.size < MAX_LABELS_PER_CARD) {
                  toggle(labelId);
                }
              }}
              onDelete={(labelId) => {
                askToDelete(labelId, draft.name);
              }}
            />
          )}
          {deleteTarget !== null && (
            <ConfirmDialog
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
              title={`Excluir a etiqueta ${deleteTarget.name}?`}
              description={deleteDescription(deleteTarget.cardCount)}
              confirmLabel="Excluir etiqueta"
              pendingLabel="Excluindo…"
              onConfirm={async () => {
                const result = await deleteLabelAction(
                  workspaceId,
                  boardId,
                  deleteTarget.id,
                );
                if (result.status === "success") {
                  startTransition(() => {
                    setIsDeleteOpen(false);
                    setDraft(null);
                  });
                }
                return result;
              }}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
