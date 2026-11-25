"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import { toast } from "sonner";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  COLUMN_NAME_MAX_LENGTH,
  columnNameSchema,
} from "@/features/boards/lib/board-schemas";
import { createColumnAction } from "@/features/boards/server/column-actions";
import { useActionForm } from "@/hooks/use-action-form";
import { cn } from "@/lib/utils";

const CREATE_FAILED = "Não foi possível criar a coluna. Tente de novo.";

type AddColumnProps = {
  workspaceId: string;
  boardId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  anchorRef: RefObject<HTMLDivElement | null>;
};

export function AddColumn({
  workspaceId,
  boardId,
  isOpen,
  onOpenChange,
  onCreated,
  anchorRef,
}: AddColumnProps) {
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRefocus = useRef(false);

  useEffect(() => {
    if (!isOpen && shouldRefocus.current) {
      shouldRefocus.current = false;
      if (document.activeElement === document.body) {
        openButtonRef.current?.focus();
      }
    }
  }, [isOpen]);

  return (
    <div
      ref={anchorRef}
      className="w-[312px] shrink-0 snap-center self-start sm:w-72"
    >
      {isOpen ? (
        <AddColumnForm
          workspaceId={workspaceId}
          boardId={boardId}
          onCancel={() => {
            shouldRefocus.current = true;
            onOpenChange(false);
          }}
          onCreated={() => {
            shouldRefocus.current = true;
            onCreated();
          }}
        />
      ) : (
        <button
          ref={openButtonRef}
          type="button"
          onClick={() => {
            onOpenChange(true);
          }}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-control text-sm font-medium text-fg-secondary outline-hidden hover:border-border-control hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-10"
        >
          <Plus aria-hidden className="size-4" />
          Adicionar coluna
        </button>
      )}
    </div>
  );
}

type AddColumnFormProps = {
  workspaceId: string;
  boardId: string;
  onCancel: () => void;
  onCreated: () => void;
};

function AddColumnForm({
  workspaceId,
  boardId,
  onCancel,
  onCreated,
}: AddColumnFormProps) {
  const {
    form: {
      register,
      setFocus,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: columnNameSchema,
    defaultValues: { name: "" },
    action: async (values) => createColumnAction(workspaceId, boardId, values),
    failure: CREATE_FAILED,
    onSuccess: onCreated,
    onError: (error) => {
      if (error.fieldErrors?.name?.at(0) === undefined) {
        toast.error(error.message);
      }
    },
  });
  const error = errors.name?.message;

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return (
    <form
      noValidate
      aria-busy={isPending}
      onSubmit={submit}
      className="flex flex-col rounded-xl bg-muted p-2"
    >
      <Input
        {...register("name")}
        aria-label="Nome da nova coluna"
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby="new-column-message"
        placeholder="Nome da coluna"
        readOnly={isPending}
        maxLength={COLUMN_NAME_MAX_LENGTH}
        autoComplete="off"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !isPending) {
            onCancel();
          }
        }}
        className="h-10 bg-card text-sm font-semibold sm:h-8"
      />
      <p
        id="new-column-message"
        aria-live="polite"
        className={cn(
          "mt-1 h-5 truncate text-[13px]/5",
          error === undefined ? "text-fg-muted" : "text-danger-text",
        )}
      >
        {error ?? `Até ${COLUMN_NAME_MAX_LENGTH} caracteres.`}
      </p>
      <div className="mt-1 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onCancel}
          className="h-10 px-3 text-[13px] sm:h-8"
        >
          Cancelar
        </Button>
        <PendingButton
          type="submit"
          isPending={isPending}
          pendingLabel="Adicionando coluna…"
          className={cn("h-10 w-[92px] text-[13px] sm:h-8", primaryButton)}
        >
          Adicionar
        </PendingButton>
      </div>
    </form>
  );
}
