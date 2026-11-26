"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/features/account/components/account-card";
import { emailChangeSchema } from "@/features/account/lib/schemas";
import {
  cancelEmailChangeAction,
  confirmEmailChangeAction,
  requestEmailChangeAction,
  resendEmailChangeAction,
} from "@/features/account/server/actions";
import type { EmailChange } from "@/features/account/server/email-change";
import { CodeForm } from "@/features/auth/components/code-form";
import { useActionForm } from "@/hooks/use-action-form";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

const REQUEST_FAILED = "Não foi possível enviar o código. Tente de novo.";
const DESCRIPTION = "Usado para entrar e para receber convites e códigos.";

type Step =
  | { kind: "idle" }
  | { kind: "request"; error?: string }
  | { kind: "code"; newEmail: string; waitSeconds: number };

type EmailCardProps = { email: string; change: EmailChange | null };

export function EmailCard({ email, change }: EmailCardProps) {
  const [step, setStep] = useState<Step>(
    change === null ? { kind: "idle" } : { kind: "code", ...change },
  );
  const [hasMoved, setHasMoved] = useState(false);
  const changeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (hasMoved && step.kind === "idle") {
      changeButtonRef.current?.focus();
    }
  }, [hasMoved, step.kind]);

  const go = (next: Step) => {
    setHasMoved(true);
    setStep(next);
  };

  if (step.kind === "idle") {
    return (
      <AccountCard id="account-email" title="E-mail" description={DESCRIPTION}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] text-muted-foreground">
              E-mail atual
            </span>
            <span title={email} className="truncate text-sm font-medium">
              {email}
            </span>
          </div>
          <Button
            variant="outline"
            ref={changeButtonRef}
            onClick={() => {
              go({ kind: "request" });
            }}
            className="h-10 w-full shrink-0 px-4 hover:bg-muted sm:w-36"
          >
            Trocar e-mail
          </Button>
        </div>
      </AccountCard>
    );
  }

  if (step.kind === "request") {
    return (
      <AccountCard id="account-email" title="E-mail" description={DESCRIPTION}>
        <EmailRequestForm
          takenError={step.error}
          onCancel={() => {
            go({ kind: "idle" });
          }}
          onSent={(sent) => {
            go({ kind: "code", ...sent });
          }}
        />
      </AccountCard>
    );
  }

  return (
    <EmailCodeStep
      newEmail={step.newEmail}
      waitSeconds={step.waitSeconds}
      focusOnMount={hasMoved}
      onRestart={(error) => {
        go({ kind: "request", error });
      }}
      onChanged={() => {
        go({ kind: "idle" });
      }}
    />
  );
}

type EmailRequestFormProps = {
  takenError?: string;
  onCancel: () => void;
  onSent: (sent: { newEmail: string; waitSeconds: number }) => void;
};

function EmailRequestForm({
  takenError,
  onCancel,
  onSent,
}: EmailRequestFormProps) {
  const {
    form: {
      register,
      setFocus,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: emailChangeSchema,
    defaultValues: { newEmail: "", password: "" },
    action: requestEmailChangeAction,
    failure: REQUEST_FAILED,
    onSuccess: onSent,
  });

  useEffect(() => {
    setFocus("newEmail");
  }, [setFocus]);

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-busy={isPending}
      className="flex flex-col gap-4"
    >
      <fieldset
        disabled={isPending}
        className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0"
      >
        <TextField
          id="account-new-email"
          type="email"
          required
          label="E-mail novo"
          placeholder="nome@empresa.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          hint="Enviamos um código para o endereço novo."
          error={errors.newEmail?.message ?? errors.root?.message ?? takenError}
          {...register("newEmail")}
        />
        <TextField
          id="account-email-password"
          type="password"
          required
          label="Senha atual"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
      </fieldset>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onCancel}
          className="h-10 px-4 hover:bg-muted"
        >
          Cancelar
        </Button>
        <PendingButton
          type="submit"
          isPending={isPending}
          pendingLabel="Enviando o código…"
          className={cn("h-10 px-4 sm:w-36", primaryButton)}
        >
          Enviar código
        </PendingButton>
      </div>
    </form>
  );
}

async function confirm(values: { code: string }): Promise<ActionResult> {
  const result = await confirmEmailChangeAction(values);
  return result.status === "success"
    ? { status: "success", data: undefined }
    : result;
}

async function resend() {
  const result = await resendEmailChangeAction();
  return result.status === "success"
    ? {
        status: "success" as const,
        data: { sent: true, waitSeconds: result.data.waitSeconds },
      }
    : result;
}

type EmailCodeStepProps = {
  newEmail: string;
  waitSeconds: number;
  focusOnMount: boolean;
  onRestart: (error?: string) => void;
  onChanged: () => void;
};

function EmailCodeStep({
  newEmail,
  waitSeconds,
  focusOnMount,
  onRestart,
  onChanged,
}: EmailCodeStepProps) {
  const restart = async () => {
    await cancelEmailChangeAction();
    onRestart();
  };

  return (
    <AccountCard
      id="account-email"
      title="E-mail"
      description={
        <>
          Enviamos um código de 8 números para{" "}
          <strong className="font-medium wrap-anywhere text-foreground">
            {newEmail}
          </strong>
          .
        </>
      }
    >
      <CodeForm
        action={confirm}
        resendAction={resend}
        switchAction={restart}
        submitLabel="Confirmar"
        layout="card"
        focusOnMount={focusOnMount}
        initialWait={waitSeconds}
        onExpired={onRestart}
        onSuccess={() => {
          toast.success("E-mail alterado", {
            description: "Avisamos o endereço antigo.",
          });
          onChanged();
        }}
      />
    </AccountCard>
  );
}
