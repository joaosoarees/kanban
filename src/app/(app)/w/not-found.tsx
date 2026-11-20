import { SearchX } from "lucide-react";
import Link from "next/link";
import { linkButton } from "@/components/button-styles";
import { StatusView } from "@/components/status-view";

export default function WorkspaceNotFound() {
  return (
    <>
      <title>Workspace não encontrado · Kanbanary</title>
      <StatusView
        icon={SearchX}
        eyebrow="404"
        title="Workspace não encontrado"
        description="Ele não existe ou você não faz parte dele. Peça acesso a quem administra o workspace."
        actions={
          <Link href="/" className={linkButton("outline", "h-10 px-4")}>
            Ver meus workspaces
          </Link>
        }
      />
    </>
  );
}
