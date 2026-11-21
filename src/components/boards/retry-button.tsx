"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PendingButton } from "@/components/pending-button";

export function RetryButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <PendingButton
      variant="outline"
      isPending={isPending}
      pendingLabel="Carregando de novo…"
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      className="h-9 px-3.5"
    >
      <RefreshCw aria-hidden />
      Tentar de novo
    </PendingButton>
  );
}
