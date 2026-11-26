import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { getCurrentUser } from "@/server/session";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <SignedOutOnly>{children}</SignedOutOnly>
      </Suspense>
    </AuthShell>
  );
}

async function SignedOutOnly({ children }: { children: ReactNode }) {
  if (await getCurrentUser()) {
    redirect("/");
  }

  return children;
}
