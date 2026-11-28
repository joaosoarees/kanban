"use client";

import { CircleAlert, Info } from "lucide-react";
import { useEffect } from "react";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import type { ChecklistNotice as Notice } from "@/features/boards/hooks/use-card-checklist";
import type { ChecklistFormsState } from "@/features/boards/hooks/use-checklist-forms";
import { cn } from "@/lib/utils";

const KBD =
  "rounded-sm border border-b-2 px-1 font-sans text-xs text-fg-secondary";

type TextFormProps = {
  form: ChecklistFormsState["add"] | ChecklistFormsState["edit"];
  label: string;
  submitLabel: string;
  pendingLabel: string;
  messageId: string;
  hint: string;
  onCancel: () => void;
};

export function ChecklistTextForm({
  form: { form, submit, isPending },
  label,
  submitLabel,
  pendingLabel,
  messageId,
  hint,
  onCancel,
}: TextFormProps) {
  const { errors } = form.formState;
  const error = errors.text?.message ?? errors.root?.message;
  const { setFocus } = form;

  useEffect(() => {
    setFocus("text");
  }, [setFocus]);

  const field = form.register("text", {
    onChange: () => {
      form.clearErrors("root");
    },
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5"
    >
      <input
        {...field}
        aria-label={label}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={messageId}
        readOnly={isPending}
        autoComplete="off"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !isPending) {
            event.stopPropagation();
            onCancel();
          }
        }}
        className={cn(
          "h-11 w-full rounded-lg border bg-card px-2.5 text-[15px] outline-hidden focus-visible:ring-3 sm:h-9 sm:text-sm",
          error === undefined
            ? "border-input focus-visible:border-ring focus-visible:ring-ring/50"
            : "border-destructive focus-visible:ring-destructive/20",
          isPending && "bg-muted text-fg-secondary",
        )}
      />
      <div className="flex min-h-11 flex-wrap items-center gap-2 sm:min-h-9">
        <p
          id={messageId}
          aria-live="polite"
          className={cn(
            "mr-auto flex min-w-0 items-center gap-1.5 text-[13px]/5",
            error === undefined ? "text-fg-muted" : "text-danger-text",
          )}
        >
          {error === undefined ? (
            <span className="hidden items-center gap-1 sm:flex">
              <kbd className={KBD}>Enter</kbd> {hint} ·{" "}
              <kbd className={KBD}>Esc</kbd> cancela
            </span>
          ) : (
            <>
              <CircleAlert aria-hidden className="size-3.5 shrink-0" />
              {error}
            </>
          )}
        </p>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={onCancel}
          className="h-11 px-3 sm:h-9"
        >
          Cancelar
        </Button>
        <PendingButton
          type="submit"
          isPending={isPending}
          pendingLabel={pendingLabel}
          className={cn("h-11 min-w-[96px] sm:h-9", primaryButton)}
        >
          {submitLabel}
        </PendingButton>
      </div>
    </form>
  );
}

export function ChecklistNotice({ notice }: { notice: Notice | null }) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "flex min-h-5 min-w-0 flex-1 items-center gap-1.5 text-[13px]/5",
        notice?.tone === "info" ? "text-fg-muted" : "text-danger-text",
      )}
    >
      {notice !== null &&
        (notice.tone === "info" ? (
          <Info aria-hidden className="size-3.5 shrink-0" />
        ) : (
          <CircleAlert aria-hidden className="size-3.5 shrink-0" />
        ))}
      {notice?.message}
    </p>
  );
}
