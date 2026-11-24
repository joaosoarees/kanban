import type { Metadata } from "next";
import { SquareKanban } from "lucide-react";
import { BackToBoardsLink } from "@/components/boards/back-to-boards-link";
import { StatusView } from "@/components/status-view";

export const metadata: Metadata = { title: "Quadro não encontrado" };

export default function BoardNotFound() {
  return (
    <StatusView
      icon={SquareKanban}
      eyebrow="404"
      title="Quadro não encontrado"
      description="Ele pode ter sido excluído, ou você não tem acesso a este workspace."
      actions={<BackToBoardsLink />}
    />
  );
}
