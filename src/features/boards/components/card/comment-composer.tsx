"use client";

import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import type { CommentFormsState } from "@/features/boards/hooks/use-comment-forms";
import { cn } from "@/lib/utils";
import { CommentField } from "./comment-field";

type CommentComposerProps = {
  cardId: string;
  composer: CommentFormsState["composer"];
};

const KBD =
  "rounded-sm border border-b-2 px-1 font-sans text-xs text-fg-secondary";

export function CommentComposer({ cardId, composer }: CommentComposerProps) {
  const { form, submit, isPending, body, hasDraft, fieldRef } = composer;
  const { errors } = form.formState;
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
