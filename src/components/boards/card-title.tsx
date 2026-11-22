"use client";

import { unstable_rethrow } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { renameCardAction } from "@/app/(app)/w/[slug]/b/card-actions";
import { DialogTitle } from "@/components/ui/dialog";
import { CARD_TITLE_MAX_LENGTH, cardTitleSchema } from "@/lib/card-schemas";

const RENAME_FAILED = "Não foi possível salvar o título. Tente de novo.";
const TITLE_TEXT =
  "w-full rounded-md px-1.5 py-0.5 text-xl/7 font-semibold tracking-tight wrap-anywhere";

type CardTitleProps = {
  workspaceId: string;
  boardId: string;
  cardId: string;
  title: string;
};

export function CardTitle({
  workspaceId,
  boardId,
  cardId,
  title,
}: CardTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shouldRefocus = useRef(false);

  useEffect(() => {
    if (!isEditing && shouldRefocus.current) {
      shouldRefocus.current = false;
      buttonRef.current?.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <CardTitleEditor
          workspaceId={workspaceId}
          boardId={boardId}
          cardId={cardId}
          title={title}
          onClose={(refocus) => {
            shouldRefocus.current = refocus;
            setIsEditing(false);
          }}
        />
      </>
    );
  }

  return (
    <DialogTitle className="text-xl/7">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Renomear o card ${title}`}
        onClick={() => {
          setIsEditing(true);
        }}
        className={`${TITLE_TEXT} cursor-text text-left outline-hidden transition-colors duration-150 hover:bg-zinc-100 focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none`}
      >
        {title}
      </button>
    </DialogTitle>
  );
}

type CardTitleEditorProps = CardTitleProps & {
  onClose: (refocus: boolean) => void;
};

function CardTitleEditor({
  workspaceId,
  boardId,
  cardId,
  title,
  onClose,
}: CardTitleEditorProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isCancelled = useRef(false);
  const [value, setValue] = useState(title);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const messageId = `${cardId}-title-message`;

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const close = () => {
    onClose(document.activeElement === inputRef.current);
  };

  const save = () => {
    if (isCancelled.current || isPending) {
      return;
    }
    const parsed = cardTitleSchema.safeParse({ title: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (parsed.data.title === title) {
      close();
      return;
    }

    startTransition(async () => {
      try {
        const result = await renameCardAction(
          workspaceId,
          boardId,
          cardId,
          parsed.data,
        );
        if (result.status === "error") {
          const fieldError = result.fieldErrors?.title?.at(0);
          if (fieldError !== undefined) {
            setError(fieldError);
            return;
          }
          if (result.gone === true) {
            return;
          }
          toast.error(result.message);
        }
      } catch (caught) {
        unstable_rethrow(caught);
        console.error(caught);
        toast.error(RENAME_FAILED);
      }
      startTransition(close);
    });
  };

  return (
    <div>
      <textarea
        ref={inputRef}
        rows={1}
        aria-label="Título do card"
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : messageId}
        value={value}
        readOnly={isPending}
        maxLength={CARD_TITLE_MAX_LENGTH}
        onChange={(event) => {
          setValue(event.target.value);
          setError(undefined);
        }}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            save();
          }
          if (event.key === "Escape" && !isPending) {
            event.stopPropagation();
            isCancelled.current = true;
            close();
          }
        }}
        className={`${TITLE_TEXT} block field-sizing-content resize-none border border-brand bg-white outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50`}
      />
      {error !== undefined && (
        <p
          id={messageId}
          role="alert"
          className="mt-1 flex items-center gap-1.5 text-[13px]/5 text-red-700"
        >
          <span
            aria-hidden
            className="size-[5px] shrink-0 rounded-full bg-destructive"
          />
          {error}
        </p>
      )}
    </div>
  );
}
