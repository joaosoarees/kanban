"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { renameColumnAction } from "@/features/boards/column-actions";
import {
  COLUMN_NAME_MAX_LENGTH,
  columnNameSchema,
} from "@/features/boards/schemas";
import { useActionForm } from "@/hooks/use-action-form";
import { cn } from "@/lib/utils";

const COUNTER_FROM = COLUMN_NAME_MAX_LENGTH - 5;
const RENAME_FAILED = "Não foi possível renomear a coluna. Tente de novo.";

type ColumnNameEditorProps = {
  workspaceId: string;
  boardId: string;
  columnId: string;
  name: string;
  onClose: (hadFocus: boolean) => void;
};

export function ColumnNameEditor({
  workspaceId,
  boardId,
  columnId,
  name,
  onClose,
}: ColumnNameEditorProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isCancelled = useRef(false);

  const close = () => {
    onClose(document.activeElement === inputRef.current);
  };

  const {
    form: {
      register,
      control,
      getValues,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: columnNameSchema,
    defaultValues: { name },
    action: async (values) =>
      renameColumnAction(workspaceId, boardId, columnId, values),
    failure: RENAME_FAILED,
    onSuccess: close,
    onError: (error) => {
      if (error.fieldErrors?.name?.at(0) === undefined) {
        toast.error(error.message);
        close();
      }
    },
  });
  const { ref: registerRef, onBlur, ...field } = register("name");
  const value = useWatch({ control, name: "name" });
  const error = errors.name?.message;

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const save = () => {
    if (isCancelled.current || isPending) {
      return;
    }
    const parsed = columnNameSchema.safeParse(getValues());
    if (parsed.success && parsed.data.name === name) {
      close();
      return;
    }
    submit();
  };

  const message =
    error ??
    (value.length >= COUNTER_FROM
      ? `${value.length} de ${COLUMN_NAME_MAX_LENGTH} caracteres`
      : undefined);

  return (
    <div className="relative min-w-0 flex-1">
      <Input
        {...field}
        ref={(element) => {
          registerRef(element);
          inputRef.current = element;
        }}
        aria-label="Nome da coluna"
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={
          message === undefined ? undefined : `${columnId}-name-message`
        }
        readOnly={isPending}
        maxLength={COLUMN_NAME_MAX_LENGTH}
        autoComplete="off"
        onBlur={(event) => {
          void onBlur(event);
          save();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }
          if (event.key === "Escape" && !isPending) {
            event.stopPropagation();
            isCancelled.current = true;
            close();
          }
        }}
        className="h-9 bg-card pr-8 text-sm font-semibold sm:h-8"
      />
      {isPending && (
        <span className="absolute inset-y-0 right-2 flex items-center">
          <Loader2
            aria-hidden
            className="size-4 animate-spin text-fg-muted motion-reduce:animate-none"
          />
          <span className="sr-only">Salvando o nome…</span>
        </span>
      )}
      {message !== undefined && (
        <p
          id={`${columnId}-name-message`}
          aria-live="polite"
          className={cn(
            "absolute inset-x-0 top-full z-10 mt-1 h-6 truncate bg-muted text-[13px]/6",
            error === undefined ? "text-fg-muted" : "text-danger-text",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
