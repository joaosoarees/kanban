import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { requireUser } from "@/lib/auth";
import { getMyWorkspaces } from "@/lib/workspaces";

type HeaderFrameProps = {
  children?: ReactNode;
  actions?: ReactNode;
};

function HeaderFrame({ children, actions }: HeaderFrameProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b bg-white px-3 sm:px-6">
      <nav
        aria-label="Navegação principal"
        className="flex min-w-0 items-center gap-2"
      >
        <Link
          href="/"
          aria-label="Kanbanary, seus workspaces"
          className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <LogoMark />
          <span className="hidden text-base font-semibold tracking-tight sm:inline">
            Kanbanary
          </span>
        </Link>
        {children}
      </nav>
      {actions ?? <span aria-hidden className="size-10 shrink-0" />}
    </header>
  );
}

export async function AppHeader({ crumb }: { crumb: ReactNode }) {
  const [user, workspaces] = await Promise.all([
    requireUser(),
    getMyWorkspaces(),
  ]);

  return (
    <HeaderFrame actions={<UserMenu name={user.name} email={user.email} />}>
      <WorkspaceSwitcher
        workspaces={workspaces.map(({ id, name, slug }) => ({
          id,
          name,
          slug,
        }))}
      />
      {crumb}
    </HeaderFrame>
  );
}

export function AppHeaderFallback() {
  return <HeaderFrame />;
}
