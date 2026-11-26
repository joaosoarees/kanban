"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MAIL_FAILED_MESSAGE } from "@/features/auth/lib/email-code";
import type { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/run-action";
import { cn } from "@/lib/utils";

export type ResendAction = () => Promise<
  ActionResult<{ sent: boolean; waitSeconds: number }>
>;

type Notice = { tone: "info" | "error"; text: string };

type ResendOptions = {
  action: ResendAction;
  initialWait: number;
  onExpired: () => void;
  onNotice: (notice: Notice | null) => void;
};

const SENT_NOTICE: Notice = { tone: "info", text: "Enviamos um código novo." };

function formatWait(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function useResendCode({
  action,
  initialWait,
  onExpired,
  onNotice,
}: ResendOptions) {
  const [wait, setWait] = useState(initialWait);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setInterval(() => {
      setWait((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const resend = () => {
    onNotice(null);
    startTransition(async () => {
      const result = await runAction(action, MAIL_FAILED_MESSAGE);
      if (result.status === "success") {
        setWait(result.data.waitSeconds);
        if (result.data.sent) {
          onNotice(SENT_NOTICE);
        }
        return;
      }
      if (result.gone === true) {
        onExpired();
        return;
      }
      onNotice({ tone: "error", text: result.message });
    });
  };

  return { wait, isPending, resend };
}

type ResendProps = Omit<ResendOptions, "onNotice">;

export function ResendCode(props: ResendProps) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const { wait, isPending, resend } = useResendCode({
    ...props,
    onNotice: setNotice,
  });

  return (
    <div className="flex flex-col gap-1">
      <p className="text-center text-sm text-muted-foreground">
        Não recebeu?{" "}
        <span className="inline-block min-w-30 text-left tabular-nums">
          {isPending ? (
            "Enviando…"
          ) : wait > 0 ? (
            `Reenviar em ${formatWait(wait)}`
          ) : (
            <button
              type="button"
              onClick={resend}
              className="cursor-pointer rounded-sm font-medium text-brand-fg underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Reenviar código
            </button>
          )}
        </span>
      </p>
      <output
        className={cn(
          "block min-h-5 text-center text-[13px]/5 text-pretty",
          notice?.tone === "error"
            ? "text-danger-text"
            : "text-muted-foreground",
        )}
      >
        {notice?.text}
      </output>
    </div>
  );
}

function toastNotice(notice: Notice | null) {
  if (notice === null) {
    return;
  }
  if (notice.tone === "error") {
    toast.error(notice.text);
    return;
  }
  toast.success(notice.text);
}

export function ResendButton(props: ResendProps) {
  const { wait, isPending, resend } = useResendCode({
    ...props,
    onNotice: toastNotice,
  });

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending || wait > 0}
      aria-busy={isPending || undefined}
      onClick={resend}
      className="h-10 w-full px-4 tabular-nums enabled:hover:bg-muted sm:w-42"
    >
      {isPending
        ? "Enviando…"
        : wait > 0
          ? `Reenviar em ${formatWait(wait)}`
          : "Reenviar código"}
    </Button>
  );
}
