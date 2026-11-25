"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { primaryButton } from "@/components/button-styles";
import { StatusView } from "@/components/status-view";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RootError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusView
      icon={TriangleAlert}
      tone="danger"
      title="Algo deu errado"
      description="Algo falhou do nosso lado. Tente de novo em instantes."
      actions={
        <Button
          onClick={retry}
          className={cn("h-11 px-4 sm:h-10", primaryButton)}
        >
          Tentar de novo
        </Button>
      }
    />
  );
}
