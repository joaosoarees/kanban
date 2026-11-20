import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { StatusView } from "@/components/status-view";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

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
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "h-10 px-4",
            })}
          >
            Ver meus workspaces
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ className: "h-10 px-4" }),
              "hover:bg-brand-strong active:bg-brand-deep",
            )}
          >
            Entrar
          </Link>
        )
      }
    />
  );
}
