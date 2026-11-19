import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative min-h-svh ruled [--column-start:max(2.5rem,calc(50%_-_16rem))]">
      <div
        aria-hidden
        className="absolute inset-y-0 left-[calc(var(--column-start)_-_1.5rem)] w-px bg-margin"
      />
      <div className="ml-(--column-start) w-[min(22.5rem,calc(100%_-_var(--column-start)_-_1rem))] pt-12 pb-24 sm:pt-24">
        <p className="pt-[14px] text-[2rem] leading-[34px] font-semibold tracking-tight text-ink">
          Kanbanary
        </p>
        <Suspense fallback={null}>
          <SignedOutOnly>{children}</SignedOutOnly>
        </Suspense>
      </div>
    </main>
  );
}

async function SignedOutOnly({ children }: { children: ReactNode }) {
  if (await getCurrentUser()) {
    redirect("/");
  }

  return children;
}
