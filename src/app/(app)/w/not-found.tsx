import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/app-header";
import { linkButton } from "@/components/button-styles";
import { StatusView } from "@/components/status-view";

export const metadata: Metadata = { title: "Workspace não encontrado" };

export default function WorkspaceNotFound() {
  return (
    <>
      <Suspense fallback={<AppHeaderFallback />}>
        <AppHeader />
      </Suspense>
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
