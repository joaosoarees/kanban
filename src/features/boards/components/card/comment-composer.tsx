"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";
import { useWatch } from "react-hook-form";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { useActionForm } from "@/hooks/use-action-form";
import { commentSchema } from "@/features/boards/lib/comment-schemas";
import type { CardComment } from "@/features/boards/server/comment-queries";
import { createCommentAction } from "@/features/boards/server/comment-actions";
import { hasVisibleText } from "@/lib/text";
import { cn } from "@/lib/utils";
import { CommentField, type CommentFormState } from "./comment-field";

type CommentComposerProps = {
  workspaceId: string;
  boardId: string;
  cardId: string;
  onCreated: (comment: CardComment) => void;
  fieldRef: RefObject<HTMLTextAreaElement | null>;
  onStateChange: (state: CommentFormState) => void;
};

const KBD =
  "rounded-sm border border-b-2 px-1 font-sans text-xs text-fg-secondary";

export function CommentComposer({
  workspaceId,
  boardId,
  cardId,
  onCreated,
  fieldRef,
  onStateChange,
}: CommentComposerProps) {
  const { form, submit, isPending } = useActionForm({
    schema: commentSchema,
    defaultValues: { body: "" },
    action: async (values) =>
      createCommentAction(workspaceId, boardId, cardId, values),
    failure: "Não foi possível comentar. Tente de novo.",
    onSuccess: (comment) => {
      form.reset({ body: "" });
      onCreated(comment);
    },
  });
  const body = useWatch({ control: form.control, name: "body" });
  const { errors } = form.formState;
  const hasDraft = hasVisibleText(body);
  const reportState = useEffectEvent(onStateChange);

  useEffect(() => {
    reportState({ isDirty: hasDraft, isPending });
  }, [hasDraft, isPending]);

  const field = form.register("body", {
    onChange: () => {
      form.clearErrors("root");
    },
  });

  return (
    <form onSubmit={submit} noValidate>
      <CommentField
        {...field}
        ref={(element) => {
          field.ref(element);
          fieldRef.current = element;
        }}
        value={body}
        aria-label="Novo comentário"
        placeholder="Escreva um comentário…"
        messageId={`${cardId}-comment-message`}
        error={errors.body?.message ?? errors.root?.message}
        isPending={isPending}
        onSubmitShortcut={submit}
        hint={
          <span className="hidden items-center gap-1 sm:flex">
            <kbd className={KBD}>Ctrl</kbd>+<kbd className={KBD}>Enter</kbd>
            envia
          </span>
        }
      >
        <PendingButton
          type="submit"
          isPending={isPending}
          pendingLabel="Comentando…"
          disabled={!hasDraft}
          className={cn("h-11 min-w-[104px] sm:h-9", primaryButton)}
        >
          Comentar
        </PendingButton>
      </CommentField>
    </form>
  );
}
