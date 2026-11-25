"use client";

import { useState } from "react";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { TextField } from "@/components/text-field";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { ResendCode } from "@/features/auth/components/resend-code";
import { VerifyEmailExpired } from "@/features/auth/components/verify-email-expired";
import { CODE_LENGTH, verifyCodeSchema } from "@/features/auth/lib/email-code";
import {
  switchAccountAction,
  verifyEmailAction,
} from "@/features/auth/server/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { cn } from "@/lib/utils";

const VERIFY_FAILED = "Não foi possível confirmar. Tente de novo.";

export function VerifyEmail({
  email,
  initialWait,
}: {
  email: string;
  initialWait: number;
}) {
  const [isExpired, setIsExpired] = useState(false);
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
    action: verifyEmailAction,
    failure: VERIFY_FAILED,
    onError: (error) => {
      if (error.gone === true) {
        setIsExpired(true);
      }
    },
  });

  if (isExpired) {
    return <VerifyEmailExpired />;
  }

  return (
    <>
      <AuthHeading
        title="Confirme seu e-mail"
        description={
          <>
            Enviamos um código de {CODE_LENGTH} dígitos para{" "}
            <strong className="font-medium text-foreground">{email}</strong>.
            Ele vale por 15 minutos.
          </>
        }
      />
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
          </fieldset>
          <PendingButton
            type="submit"
            isPending={isPending}
            pendingLabel="Confirmando…"
            className={cn("h-10 w-full", primaryButton)}
          >
            Confirmar e-mail
          </PendingButton>
        </form>
        <ResendCode
          initialWait={initialWait}
          onExpired={() => {
            setIsExpired(true);
          }}
        />
        <form
          action={switchAccountAction}
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
    </>
  );
}
