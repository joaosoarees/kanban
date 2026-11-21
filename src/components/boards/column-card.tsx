"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, UnfoldHorizontal } from "lucide-react";
import { useState } from "react";
import { deleteColumnAction } from "@/app/(app)/w/[slug]/b/column-actions";
import { ColumnMenu } from "@/components/boards/column-menu";
import { ColumnNameEditor } from "@/components/boards/column-name-editor";
import type { BoardColumn } from "@/components/boards/use-board-columns";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollapsedColumns } from "@/stores/collapsed-columns";

const CARD =
  "flex h-full w-[312px] shrink-0 snap-center flex-col rounded-xl bg-zinc-100 p-2 sm:w-72";

type ColumnCardProps = {
  workspaceId: string;
  boardId: string;
  column: BoardColumn;
  index: number;
  total: number;
  onMove: (columnId: string, targetIndex: number) => void;
};

export function ColumnCard({
  workspaceId,
  boardId,
  column,
  index,
  total,
  onMove,
}: ColumnCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isCollapsed = useCollapsedColumns((state) =>
    state.collapsedIds.includes(column.id),
  );
  const toggleCollapsed = useCollapsedColumns((state) => state.toggle);
  const forgetCollapsed = useCollapsedColumns((state) => state.forget);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, disabled: isRenaming });

  const style = { transform: CSS.Translate.toString(transform), transition };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        aria-hidden
        className={cn(
          "h-full shrink-0 rounded-xl border-2 border-dashed border-brand bg-indigo-50",
          isCollapsed ? "w-12" : "w-[312px] sm:w-72",
        )}
      />
    );
  }

  if (isCollapsed) {
    return (
      <section
        ref={setNodeRef}
        style={style}
        aria-label={`Coluna ${column.name}, recolhida`}
        className="flex h-full w-12 shrink-0 snap-center flex-col items-center gap-3 rounded-xl bg-zinc-100 py-2 motion-reduce:transition-none!"
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Expandir a coluna ${column.name}`}
          onClick={() => {
            toggleCollapsed(column.id);
          }}
          className="size-11 text-zinc-600 hover:bg-zinc-200 sm:size-8"
        >
          <UnfoldHorizontal aria-hidden />
        </Button>
        <span className="min-h-0 truncate text-sm font-semibold [writing-mode:vertical-rl]">
          {column.name}
        </span>
      </section>
    );
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      aria-label={`Coluna ${column.name}`}
      className={cn(CARD, "motion-reduce:transition-none!")}
    >
      <div className="relative flex h-11 shrink-0 items-center gap-1 sm:h-10">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Arrastar a coluna ${column.name}`}
          className="hidden h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-zinc-500 outline-none hover:text-zinc-800 focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing sm:flex"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden className="size-[15px]" />
        </button>
        {isRenaming ? (
          <ColumnNameEditor
            workspaceId={workspaceId}
            boardId={boardId}
            columnId={column.id}
            name={column.name}
            onClose={() => {
              setIsRenaming(false);
            }}
          />
        ) : (
          <button
            type="button"
            aria-label={`Renomear a coluna ${column.name}`}
            onClick={() => {
              setIsRenaming(true);
            }}
            className="h-11 min-w-0 flex-1 cursor-text truncate rounded-md px-2 text-left text-[15px] font-semibold outline-none hover:bg-zinc-200 focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8 sm:text-sm"
          >
            {column.name}
          </button>
        )}
        <ColumnMenu
          name={column.name}
          canMoveLeft={index > 0}
          canMoveRight={index < total - 1}
          onRename={() => {
            setIsRenaming(true);
          }}
          onCollapse={() => {
            toggleCollapsed(column.id);
          }}
          onMoveLeft={() => {
            onMove(column.id, index - 1);
          }}
          onMoveRight={() => {
            onMove(column.id, index + 1);
          }}
          onDelete={() => {
            setIsDeleting(true);
          }}
        />
      </div>
      <p className="mt-1 h-6 shrink-0 px-2 text-[13px]/6 text-zinc-600">
        Sem cards
      </p>
      <ConfirmDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        title={`Excluir a coluna ${column.name}?`}
        description="A coluna será apagada para todo o workspace. Isso não pode ser desfeito."
        confirmLabel="Excluir coluna"
        pendingLabel="Excluindo coluna…"
        onConfirm={async () => {
          const result = await deleteColumnAction(
            workspaceId,
            boardId,
            column.id,
          );
          if (result.status === "success") {
            forgetCollapsed(column.id);
          }
          return result;
        }}
      />
    </section>
  );
}

export function ColumnPreview({ name }: { name: string }) {
  return (
    <div
      className={cn(
        CARD,
        "rotate-[1.5deg] cursor-grabbing shadow-xl motion-reduce:rotate-0",
      )}
    >
      <div className="flex h-10 items-center gap-1">
        <span className="flex h-8 w-5 items-center justify-center text-zinc-500">
          <GripVertical aria-hidden className="size-[15px]" />
        </span>
        <span className="truncate px-2 text-sm font-semibold">{name}</span>
      </div>
      <p className="mt-1 h-6 px-2 text-[13px]/6 text-zinc-600">Sem cards</p>
    </div>
  );
}
