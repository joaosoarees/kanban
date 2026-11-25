import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPassword } from "@/features/auth/components/reset-password";
import { ResetPasswordExpired } from "@/features/auth/components/reset-password-expired";
import { loadPasswordReset } from "@/features/auth/server/password-reset";
import { getPasswordReset, getPasswordResetGrant } from "@/server/session";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PasswordResetStep />
    </Suspense>
  );
}

async function PasswordResetStep() {
  const step = loadPasswordReset(
    await getPasswordReset(),
    await getPasswordResetGrant(),
  );

  if (step === null) {
    return <ResetPasswordExpired />;
  }

  return <ResetPassword key={step.step} step={step} />;
}
