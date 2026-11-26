"use client";

import { CircleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { COMMENT_MAX_LENGTH } from "@/features/boards/lib/comment-schemas";
import { codePointLength } from "@/lib/text";
import { cn } from "@/lib/utils";

const COUNTER_FROM = 4500;
const numberFormat = new Intl.NumberFormat("pt-BR");

type CommentFieldProps = Omit<ComponentProps<"textarea">, "value"> & {
  value: string;
  error: string | undefined;
  isPending: boolean;
  messageId: string;
  hint?: ReactNode;
  onSubmitShortcut: () => void;
  children: ReactNode;
};

function counterOf(length: number) {
  return `${numberFormat.format(length)}/${numberFormat.format(COMMENT_MAX_LENGTH)}`;
}

export function CommentField({
  value,
  error,
  isPending,
  messageId,
  hint,
  onSubmitShortcut,
  onKeyDown,
  className,
  children,
  ...props
}: CommentFieldProps) {
  const length = codePointLength(value);
  const isOver = length > COMMENT_MAX_LENGTH;
  const message = isOver
    ? `Até 5.000 caracteres · ${counterOf(length)}`
    : error;

  return (
    <div className={className}>
      <textarea
        {...props}
        aria-invalid={message === undefined ? undefined : true}
        aria-describedby={messageId}
        readOnly={isPending}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey) &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            onSubmitShortcut();
            return;
          }
          onKeyDown?.(event);
        }}
        className={cn(
          "block max-h-[50svh] min-h-[66px] w-full resize-none rounded-lg border border-input bg-card px-2.5 py-2 text-[15px]/[22px] wrap-anywhere outline-hidden field-sizing-content placeholder:text-muted-foreground focus-visible:ring-3 sm:text-sm/[22px]",
          message === undefined
            ? "focus-visible:border-ring focus-visible:ring-ring/50"
            : "border-destructive focus-visible:ring-destructive/20",
          isPending && "bg-muted",
        )}
      />
      <div className="mt-1.5 flex min-h-11 items-center justify-between gap-3 sm:min-h-9">
        <p
          id={messageId}
          aria-live="polite"
          className={cn(
            "flex min-w-0 items-center gap-1.5 text-[13px]/5",
            message === undefined ? "text-fg-muted" : "text-danger-text",
          )}
        >
          {message !== undefined && (
            <>
              <CircleAlert aria-hidden className="size-3.5 shrink-0" />
              {message}
            </>
          )}
          {message === undefined &&
            (length >= COUNTER_FROM ? counterOf(length) : hint)}
        </p>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
