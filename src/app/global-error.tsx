"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
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
    <html lang="pt-BR">
      <body className="flex min-h-svh flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center font-sans">
        <title>Algo deu errado · Kanbanary</title>
        <h1 className="text-2xl font-semibold tracking-tight">
          Algo deu errado
        </h1>
        <p className="max-w-md text-sm/relaxed text-muted-foreground">
          Algo falhou do nosso lado. Tente de novo em instantes.
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-3 h-10 cursor-pointer rounded-lg bg-brand px-4 text-sm font-medium text-white outline-none hover:bg-brand-strong focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
