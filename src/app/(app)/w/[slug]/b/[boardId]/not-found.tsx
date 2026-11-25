import type { Metadata } from "next";
import { SquareKanban } from "lucide-react";
import { StatusView } from "@/components/status-view";
import { BackToBoardsLink } from "@/features/boards/components/back-to-boards-link";

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
