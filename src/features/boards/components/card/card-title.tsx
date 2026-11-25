"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DialogTitle } from "@/components/ui/dialog";
import {
  CARD_TITLE_MAX_LENGTH,
  cardTitleSchema,
} from "@/features/boards/lib/card-schemas";
import { renameCardAction } from "@/features/boards/server/card-actions";
import { useActionForm } from "@/hooks/use-action-form";

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
    <>
      <DialogTitle className="text-xl/7">
        <button
          ref={buttonRef}
          type="button"
          aria-describedby={`${cardId}-title-hint`}
          onClick={() => {
            setIsEditing(true);
          }}
          className={`${TITLE_TEXT} cursor-text text-left outline-hidden transition-colors duration-150 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none`}
        >
          {title}
        </button>
      </DialogTitle>
      <span id={`${cardId}-title-hint`} hidden>
        Renomear o card
      </span>
    </>
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const isCancelled = useRef(false);
  const messageId = `${cardId}-title-message`;

  const close = () => {
    onClose(document.activeElement === inputRef.current);
  };

  const {
    form: {
      register,
      getValues,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: cardTitleSchema,
    defaultValues: { title },
    action: async (values) =>
      renameCardAction(workspaceId, boardId, cardId, values),
    failure: RENAME_FAILED,
    onSuccess: close,
    onError: (failure) => {
      if (
        failure.fieldErrors?.title?.at(0) === undefined &&
        failure.gone !== true
      ) {
        toast.error(failure.message);
      }
    },
  });
  const { ref: registerRef, onBlur, ...field } = register("title");
  const error = errors.title?.message;

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const save = () => {
    if (isCancelled.current || isPending) {
      return;
    }
    const parsed = cardTitleSchema.safeParse(getValues());
    if (parsed.success && parsed.data.title === title) {
      close();
      return;
    }
    submit();
  };

  return (
    <div>
      <textarea
        {...field}
        ref={(element) => {
          registerRef(element);
          inputRef.current = element;
        }}
        rows={1}
        aria-label="Título do card"
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : messageId}
        readOnly={isPending}
        maxLength={CARD_TITLE_MAX_LENGTH}
        onBlur={(event) => {
          void onBlur(event);
          save();
        }}
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
        className={`${TITLE_TEXT} block field-sizing-content resize-none border border-ring bg-card outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50`}
      />
      {error !== undefined && (
        <p
          id={messageId}
          role="alert"
          className="mt-1 flex items-center gap-1.5 text-[13px]/5 text-danger-text"
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
