import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSections } from "@/features/account/components/account-sections";
import { AccountSkeleton } from "@/features/account/components/account-skeleton";

export const metadata: Metadata = { title: "Sua conta" };

export default function AccountPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">
          Sua conta
        </h1>
        <p className="text-sm text-muted-foreground">
          Nome, senha e e-mail que você usa para entrar.
        </p>
      </div>
      <Suspense fallback={<AccountSkeleton />}>
        <AccountSections />
      </Suspense>
    </main>
  );
}
