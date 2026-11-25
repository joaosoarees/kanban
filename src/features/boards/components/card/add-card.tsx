"use client";

import { Plus } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CARD_TITLE_MAX_LENGTH,
  createCardSchema,
} from "@/features/boards/lib/card-schemas";
import { createCardAction } from "@/features/boards/server/card-actions";
import { cn } from "@/lib/utils";

const CREATE_FAILED = "Não foi possível criar o card. Tente de novo.";
const IDLE_HINT = "Enter cria, Esc fecha";

type AddCardProps = {
  workspaceId: string;
  boardId: string;
  columnId: string;
  onCreated: (cardId: string) => void;
};

export function AddCard({
  workspaceId,
  boardId,
  columnId,
  onCreated,
}: AddCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRefocus = useRef(false);

  useEffect(() => {
    if (!isOpen && shouldRefocus.current) {
      shouldRefocus.current = false;
      openButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (isOpen) {
    return (
      <AddCardForm
        workspaceId={workspaceId}
        boardId={boardId}
        columnId={columnId}
        onCreated={onCreated}
        onClose={(refocus) => {
          shouldRefocus.current = refocus;
          setIsOpen(false);
        }}
      />
    );
  }

  return (
    <button
      ref={openButtonRef}
      data-card-focus={columnId}
      type="button"
      onClick={() => {
        setIsOpen(true);
      }}
      className="mt-1.5 flex h-11 w-full shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-medium text-fg-secondary outline-hidden transition-colors duration-150 hover:bg-muted-strong focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none sm:h-9"
    >
      <Plus aria-hidden className="size-4" />
      Adicionar card
    </button>
  );
}

type AddCardFormProps = AddCardProps & {
  onClose: (refocus: boolean) => void;
};

function AddCardForm({
  workspaceId,
  boardId,
  columnId,
  onCreated,
  onClose,
}: AddCardFormProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const messageId = `${columnId}-new-card-message`;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    if (isPending) {
      return;
    }
    const parsed = createCardSchema.safeParse({ columnId, title: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      try {
        const result = await createCardAction(
          workspaceId,
          boardId,
          parsed.data,
        );
        if (result.status === "success") {
          startTransition(() => {
            setValue("");
            onCreated(result.data.id);
          });
          return;
        }
        setError(result.fieldErrors?.title?.at(0) ?? result.message);
      } catch (caught) {
        unstable_rethrow(caught);
        console.error(caught);
        toast.error(CREATE_FAILED);
      }
    });
  };

  const hint = isPending ? "Criando card…" : IDLE_HINT;

  return (
    <form
      noValidate
      aria-busy={isPending}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="mt-1.5 shrink-0"
    >
      <textarea
        ref={inputRef}
        rows={2}
        aria-label="Título do novo card"
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={messageId}
        placeholder="Título do card"
        value={value}
        readOnly={isPending}
        maxLength={CARD_TITLE_MAX_LENGTH}
        onChange={(event) => {
          setValue(event.target.value);
          setError(undefined);
        }}
        onBlur={() => {
          if (value.trim() === "" && !isPending) {
            onClose(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
          if (event.key === "Escape" && !isPending) {
            event.stopPropagation();
            onClose(true);
          }
        }}
        className={cn(
          "block w-full resize-none rounded-lg border bg-card px-2.5 py-2 text-[15px]/5 outline-hidden placeholder:text-muted-foreground focus-visible:ring-3 sm:text-sm/5",
          error === undefined
            ? "border-ring focus-visible:ring-ring/50"
            : "border-destructive focus-visible:ring-destructive/20",
        )}
      />
      <p
        id={messageId}
        aria-live="polite"
        className={cn(
          "mt-1 flex h-5 items-center gap-1.5 truncate px-0.5 text-[13px]/5",
          error === undefined ? "text-fg-muted" : "text-danger-text",
        )}
      >
        {error !== undefined && (
          <span
            aria-hidden
            className="size-[5px] shrink-0 rounded-full bg-destructive"
          />
        )}
        <span className="truncate">{error ?? hint}</span>
      </p>
    </form>
  );
}
