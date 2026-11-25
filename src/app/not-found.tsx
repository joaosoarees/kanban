import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { linkButton } from "@/components/button-styles";
import { StatusView } from "@/components/status-view";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <StatusView
      icon={SearchX}
      eyebrow="404"
      title="Página não encontrada"
      description="O endereço pode estar errado ou a página foi removida."
      actions={
        <Suspense fallback={<span aria-hidden className="h-10" />}>
          <NotFoundAction />
        </Suspense>
      }
    />
  );
}

async function NotFoundAction() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <Link href="/" className={linkButton("outline", "h-10 px-4")}>
        Ver meus workspaces
      </Link>
    );
  }

  return (
    <Link href="/sign-in" className={linkButton("default", "h-10 px-4")}>
      Entrar para ver seus workspaces
    </Link>
  );
}
