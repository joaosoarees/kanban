"use client";

import { useState } from "react";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { CodeForm } from "@/features/auth/components/code-form";
import { VerifyEmailExpired } from "@/features/auth/components/verify-email-expired";
import { CODE_LENGTH } from "@/features/auth/lib/email-code";
import {
  resendCodeAction,
  switchAccountAction,
  verifyEmailAction,
} from "@/features/auth/server/actions";

export function VerifyEmail({
  email,
  initialWait,
}: {
  email: string;
  initialWait: number;
}) {
  const [isExpired, setIsExpired] = useState(false);

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
      <CodeForm
        action={verifyEmailAction}
        resendAction={resendCodeAction}
        switchAction={switchAccountAction}
        submitLabel="Confirmar e-mail"
        initialWait={initialWait}
        onExpired={() => {
          setIsExpired(true);
        }}
      />
    </>
  );
}
