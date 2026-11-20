import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { linkButton } from "@/components/button-styles";
import { StatusView } from "@/components/status-view";
import { getCurrentUser } from "@/lib/auth";

const DESCRIPTION = "O endereço pode estar errado ou a página foi removida.";

export default function NotFound() {
  return (
    <>
      <title>Página não encontrada · Kanbanary</title>
      <Suspense>
        <NotFoundView />
      </Suspense>
    </>
  );
}

async function NotFoundView() {
  const user = await getCurrentUser();

  return (
    <StatusView
      icon={SearchX}
      eyebrow="404"
      title="Página não encontrada"
      description={
        user ? DESCRIPTION : `${DESCRIPTION} Entre para ver seus workspaces.`
      }
      actions={
        user ? (
          <Link href="/" className={linkButton("outline", "h-10 px-4")}>
            Ver meus workspaces
          </Link>
        ) : (
          <Link href="/sign-in" className={linkButton("default", "h-10 px-4")}>
            Entrar
          </Link>
        )
      }
    />
  );
}
