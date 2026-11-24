"use client";

import { Plus } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";
import { toast } from "sonner";
import { createColumnAction } from "@/app/(app)/w/[slug]/b/column-actions";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLUMN_NAME_MAX_LENGTH, columnNameSchema } from "@/lib/board-schemas";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const parsed = columnNameSchema.safeParse({ name: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      inputRef.current?.focus();
      return;
    }

    startTransition(async () => {
      try {
        const result = await createColumnAction(
          workspaceId,
          boardId,
          parsed.data,
        );
        if (result.status === "success") {
          startTransition(onCreated);
          return;
        }
        const fieldError = result.fieldErrors?.name?.at(0);
        if (fieldError !== undefined) {
          setError(fieldError);
          return;
        }
        toast.error(result.message);
      } catch (caught) {
        unstable_rethrow(caught);
        console.error(caught);
        toast.error(CREATE_FAILED);
      }
    });
  };

  return (
    <form
      noValidate
      aria-busy={isPending}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col rounded-xl bg-muted p-2"
    >
      <Input
        ref={inputRef}
        aria-label="Nome da nova coluna"
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby="new-column-message"
        placeholder="Nome da coluna"
        value={value}
        readOnly={isPending}
        maxLength={COLUMN_NAME_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => {
          setValue(event.target.value);
          setError(undefined);
        }}
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
