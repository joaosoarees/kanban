"use client";

import { useState } from "react";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { CodeForm } from "@/features/auth/components/code-form";
import { NewPasswordForm } from "@/features/auth/components/new-password-form";
import { ResetPasswordExpired } from "@/features/auth/components/reset-password-expired";
import { CODE_LENGTH } from "@/features/auth/lib/email-code";
import {
  resendResetCodeAction,
  restartPasswordResetAction,
  verifyResetCodeAction,
} from "@/features/auth/server/actions";
import type { ResetStep } from "@/features/auth/server/password-reset";

export function ResetPassword({ step }: { step: ResetStep }) {
  const [isExpired, setIsExpired] = useState(false);
  const expire = () => {
    setIsExpired(true);
  };

  if (isExpired) {
    return <ResetPasswordExpired />;
  }

  if (step.step === "password") {
    return (
      <>
        <AuthHeading
          title="Crie uma senha nova"
          description="Use pelo menos 8 caracteres. Depois de salvar, você entra e as outras sessões da conta são encerradas."
        />
        <NewPasswordForm onExpired={expire} />
      </>
    );
  }

  return (
    <>
      <AuthHeading
        title="Digite o código"
        description={
          <>
            Se houver uma conta com{" "}
            <strong className="font-medium text-foreground">
              {step.email}
            </strong>
            , enviamos um código de {CODE_LENGTH} dígitos. Ele vale por 15
            minutos.
          </>
        }
      />
      <CodeForm
        action={verifyResetCodeAction}
        resendAction={resendResetCodeAction}
        switchAction={restartPasswordResetAction}
        submitLabel="Confirmar código"
        initialWait={step.waitSeconds}
        onExpired={expire}
      />
    </>
  );
}
