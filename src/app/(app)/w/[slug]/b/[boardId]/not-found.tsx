"use client";

import { SquareKanban } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { linkButton } from "@/components/button-styles";
import { StatusView } from "@/components/status-view";

export default function BoardNotFound() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <>
      <title>Quadro não encontrado · Kanbanary</title>
      <StatusView
        icon={SquareKanban}
        eyebrow="404"
        title="Quadro não encontrado"
        description="Ele pode ter sido excluído, ou você não tem acesso a este workspace."
        actions={
          <Link
            href={`/w/${slug}`}
            className={linkButton("default", "h-10 px-4")}
          >
            Voltar aos quadros
          </Link>
        }
      />
    </>
  );
}
