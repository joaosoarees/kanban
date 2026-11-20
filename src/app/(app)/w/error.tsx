"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { primaryButton } from "@/components/button-styles";
import { StatusView } from "@/components/status-view";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function WorkspaceError({
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
      title="Não foi possível carregar o workspace"
      description="Algo falhou do nosso lado. Tente de novo em instantes."
      actions={
        <>
          <Button onClick={retry} className={cn("h-10 px-4", primaryButton)}>
            Tentar de novo
          </Button>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "h-10 px-4",
            })}
          >
            Ver meus workspaces
          </Link>
        </>
      }
    />
  );
}
