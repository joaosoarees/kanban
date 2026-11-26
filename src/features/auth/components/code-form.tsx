"use client";

import { useTransition } from "react";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import {
  ResendButton,
  ResendCode,
  type ResendAction,
} from "@/features/auth/components/resend-code";
import { verifyCodeSchema } from "@/features/auth/lib/email-code";
import { useActionForm } from "@/hooks/use-action-form";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

const CONFIRM_FAILED = "Não foi possível confirmar. Tente de novo.";

type CodeFormProps = {
  action: (values: { code: string }) => Promise<ActionResult>;
  resendAction: ResendAction;
  switchAction: () => Promise<void>;
  submitLabel: string;
  initialWait: number;
  onExpired: (message?: string) => void;
  onSuccess?: () => void;
  layout?: "page" | "card";
};

export function CodeForm({
  action,
  resendAction,
  switchAction,
  submitLabel,
  initialWait,
  onExpired,
  onSuccess,
  layout = "page",
}: CodeFormProps) {
  const [isSwitching, startSwitch] = useTransition();
  const {
    form: {
      register,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: verifyCodeSchema,
    defaultValues: { code: "" },
    action,
    failure: CONFIRM_FAILED,
    onSuccess,
    onError: (error) => {
      if (error.gone === true) {
        onExpired(error.message);
      }
    },
  });

  const expire = () => {
    onExpired();
  };

  const codeField = (
    <TextField
      id="code"
      required
      label="Código"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoCapitalize="none"
      spellCheck={false}
      inputClassName="text-[15px] tracking-[0.12em] tabular-nums md:text-[15px]"
      hint="Confira também a caixa de spam."
      error={errors.code?.message ?? errors.root?.message}
      {...register("code")}
    />
  );

  if (layout === "card") {
    return (
      <form
        onSubmit={submit}
        noValidate
        aria-busy={isPending}
        className="flex flex-col gap-4"
      >
        <fieldset
          disabled={isPending}
          className="m-0 flex min-w-0 flex-col border-0 p-0"
        >
          {codeField}
        </fieldset>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <ResendButton
              action={resendAction}
              initialWait={initialWait}
              onExpired={expire}
            />
            <Button
              type="button"
              variant="ghost"
              disabled={isSwitching}
              onClick={() => {
                startSwitch(async () => {
                  await switchAction();
                });
              }}
              className="h-10 px-3 hover:bg-muted"
            >
              Usar outro e-mail
            </Button>
          </div>
          <PendingButton
            type="submit"
            isPending={isPending}
            pendingLabel="Confirmando…"
            className={cn("h-10 w-full sm:w-35", primaryButton)}
          >
            {submitLabel}
          </PendingButton>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={submit}
        noValidate
        aria-busy={isPending}
        className="flex flex-col gap-5"
      >
        <fieldset
          disabled={isPending}
          className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0"
        >
          {codeField}
        </fieldset>
        <PendingButton
          type="submit"
          isPending={isPending}
          pendingLabel="Confirmando…"
          className={cn("h-10 w-full", primaryButton)}
        >
          {submitLabel}
        </PendingButton>
      </form>
      <ResendCode
        action={resendAction}
        initialWait={initialWait}
        onExpired={expire}
      />
      <form
        action={switchAction}
        className="text-center text-sm text-muted-foreground"
      >
        Não é este e-mail?{" "}
        <button
          type="submit"
          className="cursor-pointer rounded-sm font-medium text-brand-fg underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Usar outro e-mail
        </button>
      </form>
    </div>
  );
}
