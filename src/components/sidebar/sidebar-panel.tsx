"use client";

import { LayoutGrid, Settings, SquareKanban, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { NewBoardButton } from "@/components/boards/new-board-button";
import { RetryButton } from "@/components/boards/retry-button";
import { LogoMark } from "@/components/logo";
import { SidebarLink } from "@/components/sidebar/sidebar-links";
import { UserMenu } from "@/components/user-menu";
import {
  WorkspaceSwitcher,
  type SwitcherWorkspace,
} from "@/components/workspace-switcher";

export type SidebarBoard = { id: string; name: string };

export type SidebarData = {
  user: { name: string; email: string };
  workspace: SwitcherWorkspace & {
    canManageBoards: boolean;
    canConfigure: boolean;
  };
  workspaces: SwitcherWorkspace[];
  boards: SidebarBoard[] | null;
};

export function sidebarPaths(slug: string) {
  const root = `/w/${slug}`;
  return {
    root,
    board: (boardId: string) => `${root}/b/${boardId}`,
    settings: `${root}/settings`,
    members: `${root}/settings/members`,
  };
}

export function useIsCurrentPath() {
  const pathname = usePathname().toLowerCase();
  return (href: string, { nested = false } = {}) => {
    const target = href.toLowerCase();
    return pathname === target || (nested && pathname.startsWith(`${target}/`));
  };
}

export function revealCurrentLink(scrollArea: HTMLElement | null) {
  const currentLink = scrollArea?.querySelector<HTMLElement>(
    '[aria-current="page"]',
  );
  if (!scrollArea || !currentLink) {
    return;
  }
  const area = scrollArea.getBoundingClientRect();
  const link = currentLink.getBoundingClientRect();
  if (link.top < area.top || link.bottom > area.bottom) {
    scrollArea.scrollTop +=
      link.top - area.top - (area.height - link.height) / 2;
  }
}

export function SidebarHome() {
  return (
    <Link
      href="/"
      aria-label="Kanbanary, seus workspaces"
      className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <LogoMark />
      <span className="text-base font-semibold tracking-tight">Kanbanary</span>
    </Link>
  );
}

function BoardLinks({
  slug,
  boards,
}: {
  slug: string;
  boards: SidebarBoard[];
}) {
  const isCurrent = useIsCurrentPath();
  const paths = sidebarPaths(slug);

  return (
    <ul className="flex flex-col gap-0.5">
      {boards.map((board) => (
        <li key={board.id}>
          <SidebarLink
            href={paths.board(board.id)}
            icon={SquareKanban}
            label={board.name}
            current={isCurrent(paths.board(board.id), { nested: true })}
          />
        </li>
      ))}
    </ul>
  );
}

export function BoardsBody({
  data,
  allowCreate,
}: {
  data: SidebarData;
  allowCreate: boolean;
}) {
  const { workspace, boards } = data;

  if (boards === null) {
    return (
      <div className="flex flex-col items-start gap-2.5 px-2.5 py-2">
        <p className="text-[13px] text-fg-secondary">
          Não foi possível carregar os quadros.
        </p>
        <RetryButton />
      </div>
    );
  }

  if (boards.length === 0) {
    if (workspace.canManageBoards && !allowCreate) {
      return (
        <p className="px-2.5 py-2 text-[13px] text-fg-muted">
          Nenhum quadro ainda.
        </p>
      );
    }
    return workspace.canManageBoards ? (
      <div className="flex flex-col items-start gap-2.5 px-2.5 py-2">
        <p className="text-[13px] text-fg-muted">Nenhum quadro ainda.</p>
        <NewBoardButton
          workspaceId={workspace.id}
          boardsHref={sidebarPaths(workspace.slug).root}
          label="Novo quadro"
          appearance="outline"
          className="h-9"
        />
      </div>
    ) : (
      <p className="px-2.5 py-2 text-[13px] text-fg-muted">
        Nenhum quadro ainda. Peça a um admin para criar o primeiro.
      </p>
    );
  }

  return <BoardLinks slug={workspace.slug} boards={boards} />;
}

type SidebarPanelProps = {
  data: SidebarData;
  headerAction: ReactNode;
};

export function SidebarPanel({ data, headerAction }: SidebarPanelProps) {
  const { user, workspace, workspaces, boards } = data;
  const isCurrent = useIsCurrentPath();
  const paths = sidebarPaths(workspace.slug);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    revealCurrentLink(scrollRef.current);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 pr-2 pl-4">
        <SidebarHome />
        {headerAction}
      </div>
      <div className="shrink-0 px-2 pt-2">
        <WorkspaceSwitcher
          current={workspace}
          workspaces={workspaces}
          trigger="card"
        />
      </div>
      <nav
        aria-label="Quadros do workspace"
        className="flex min-h-0 flex-1 flex-col pt-3"
      >
        <div className="flex h-8 shrink-0 items-center justify-between pr-3 pl-4.5">
          <h2 className="text-xs font-semibold text-fg-muted">Quadros</h2>
          {workspace.canManageBoards && boards !== null && (
            <NewBoardButton
              workspaceId={workspace.id}
              boardsHref={paths.root}
              label="Novo quadro"
              appearance="icon"
            />
          )}
        </div>
        <div className="shrink-0 px-2 pt-1">
          <SidebarLink
            href={paths.root}
            icon={LayoutGrid}
            label="Todos os quadros"
            current={isCurrent(paths.root)}
          />
        </div>
        <div aria-hidden className="mx-4 my-1.5 h-px shrink-0 bg-border" />
        <div
          ref={scrollRef}
          className="relative min-h-0 flex-1 overflow-y-auto px-2 pb-2"
        >
          <BoardsBody data={data} allowCreate />
        </div>
      </nav>
      <nav
        aria-label="Workspace"
        className="flex shrink-0 flex-col gap-0.5 border-t p-2"
      >
        <SidebarLink
          href={paths.members}
          icon={Users}
          label="Membros"
          current={isCurrent(paths.members)}
        />
        {workspace.canConfigure && (
          <SidebarLink
            href={paths.settings}
            icon={Settings}
            label="Configurações"
            current={isCurrent(paths.settings)}
          />
        )}
      </nav>
      <div className="shrink-0 border-t p-2">
        <UserMenu
          name={user.name}
          email={user.email}
          trigger="row"
          side="top"
        />
      </div>
    </div>
  );
}
