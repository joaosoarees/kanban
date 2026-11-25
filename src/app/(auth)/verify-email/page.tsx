import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmail } from "@/features/auth/components/verify-email";
import { VerifyEmailExpired } from "@/features/auth/components/verify-email-expired";
import { loadPendingVerification } from "@/features/auth/server/verification";
import { getPendingVerification } from "@/server/session";

export const metadata: Metadata = { title: "Confirmar e-mail" };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <PendingVerification />
    </Suspense>
  );
}

async function PendingVerification() {
  const pending = await getPendingVerification();
  const screen =
    pending === null ? null : await loadPendingVerification(pending);

  if (screen === null) {
    return <VerifyEmailExpired />;
  }

  return <VerifyEmail email={screen.email} initialWait={screen.waitSeconds} />;
}
