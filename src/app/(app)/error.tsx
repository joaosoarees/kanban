"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { StatusView } from "@/components/status-view";
import { Button } from "@/components/ui/button";

export default function AppError({
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
          className="h-10 px-4 enabled:hover:bg-brand-strong"
        >
          Tentar de novo
        </Button>
      }
    />
  );
}
