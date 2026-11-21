"use client";

import { Loader2 } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { renameColumnAction } from "@/app/(app)/w/[slug]/b/column-actions";
import { Input } from "@/components/ui/input";
import { COLUMN_NAME_MAX_LENGTH, columnNameSchema } from "@/lib/board-schemas";
import { cn } from "@/lib/utils";

const COUNTER_FROM = COLUMN_NAME_MAX_LENGTH - 5;
const RENAME_FAILED = "Não foi possível renomear a coluna. Tente de novo.";

type ColumnNameEditorProps = {
  workspaceId: string;
  boardId: string;
  columnId: string;
  name: string;
  onClose: () => void;
};

export function ColumnNameEditor({
  workspaceId,
  boardId,
  columnId,
  name,
  onClose,
}: ColumnNameEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isCancelled = useRef(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const save = () => {
    if (isCancelled.current || isPending) {
      return;
    }
    const parsed = columnNameSchema.safeParse({ name: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (parsed.data.name === name) {
      onClose();
      return;
    }

    startTransition(async () => {
      try {
        const result = await renameColumnAction(
          workspaceId,
          boardId,
          columnId,
          parsed.data,
        );
        const fieldError =
          result.status === "error"
            ? result.fieldErrors?.name?.at(0)
            : undefined;
        if (fieldError !== undefined) {
          setError(fieldError);
          return;
        }
        if (result.status === "error") {
          toast.error(result.message);
        }
      } catch (caught) {
        unstable_rethrow(caught);
        console.error(caught);
        toast.error(RENAME_FAILED);
      }
      onClose();
    });
  };

  const message =
    error ??
    (value.length >= COUNTER_FROM
      ? `${value.length} de ${COLUMN_NAME_MAX_LENGTH} caracteres`
      : undefined);

  return (
    <div className="relative min-w-0 flex-1">
      <Input
        ref={inputRef}
        aria-label="Nome da coluna"
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={
          message === undefined ? undefined : `${columnId}-name-message`
        }
        value={value}
        readOnly={isPending}
        maxLength={COLUMN_NAME_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => {
          setValue(event.target.value);
          setError(undefined);
        }}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }
          if (event.key === "Escape" && !isPending) {
            event.stopPropagation();
            isCancelled.current = true;
            onClose();
          }
        }}
        className="h-9 bg-white pr-8 text-sm font-semibold sm:h-8"
      />
      {isPending && (
        <span className="absolute inset-y-0 right-2 flex items-center">
          <Loader2
            aria-hidden
            className="size-4 animate-spin text-zinc-600 motion-reduce:animate-none"
          />
          <span className="sr-only">Salvando o nome…</span>
        </span>
      )}
      {message !== undefined && (
        <p
          id={`${columnId}-name-message`}
          aria-live="polite"
          className={cn(
            "absolute inset-x-0 top-full z-10 mt-1 h-6 truncate bg-zinc-100 text-[13px]/6",
            error === undefined ? "text-zinc-600" : "text-red-700",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
