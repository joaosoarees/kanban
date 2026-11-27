"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { linkButton, primaryButton } from "@/components/button-styles";
import { StatusView } from "@/components/status-view";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BoardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusView
      icon={TriangleAlert}
      tone="danger"
      title="Não foi possível carregar o quadro"
      description="Confira sua conexão e tente de novo. Suas colunas continuam salvas."
      actions={
        <>
          <Button
            onClick={() => {
              retry();
            }}
            className={cn("h-10 px-4", primaryButton)}
          >
            <RefreshCw aria-hidden />
            Tentar de novo
          </Button>
          <Link
            href={`/w/${slug}`}
            className={linkButton("outline", "h-10 px-4")}
          >
            Voltar aos quadros
          </Link>
        </>
      }
    />
  );
}
