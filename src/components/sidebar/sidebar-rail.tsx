"use client";

import { LayoutGrid, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { LogoMark } from "@/components/logo";
import {
  ICON_BUTTON,
  ICON_BUTTON_CURRENT,
  revealCurrentLink,
} from "@/components/sidebar/sidebar-links";
import {
  BoardsBody,
  sidebarPaths,
  useIsCurrentPath,
  type SidebarData,
} from "@/components/sidebar/sidebar-panel";
import { ToggleButton } from "@/components/sidebar/sidebar-toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserMenu } from "@/components/user-menu";
import { WorkspaceSwitcher } from "@/features/workspaces/components/workspace-switcher";
import { cn } from "@/lib/utils";

function RailLink({
  href,
  label,
  current,
  children,
}: {
  href: string;
  label: string;
  current: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            aria-label={label}
            aria-current={current ? "page" : undefined}
            className={cn(ICON_BUTTON, current && ICON_BUTTON_CURRENT)}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function RailBoards({ data }: { data: SidebarData }) {
  const { workspace, boards } = data;
  const paths = sidebarPaths(workspace.slug);
  const isCurrent = useIsCurrentPath();
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inBoards =
    isCurrent(paths.root) ||
    (boards ?? []).some((board) =>
      isCurrent(paths.board(board.id), { nested: true }),
    );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (isOpen) {
          revealCurrentLink(scrollRef.current);
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              aria-label="Quadros"
              className={cn(ICON_BUTTON, inBoards && ICON_BUTTON_CURRENT)}
            />
          }
        >
          <LayoutGrid aria-hidden />
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Quadros
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        ref={scrollRef}
        data-sidebar-scroll=""
        side="right"
        align="start"
        sideOffset={8}
        className="max-h-[min(480px,var(--available-height))] w-75 gap-1 overflow-y-auto p-1.5"
        onClickCapture={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) {
            setOpen(false);
          }
        }}
      >
        <RailBoardsBody data={data} />
      </PopoverContent>
    </Popover>
  );
}

function RailBoardsBody({ data }: { data: SidebarData }) {
  const { workspace } = data;
  const isCurrent = useIsCurrentPath();
  const paths = sidebarPaths(workspace.slug);

  return (
    <>
      <p className="px-2.5 pt-1 pb-1.5 text-[13px]/5 font-semibold text-fg-muted">
        Quadros
      </p>
      <Link
        href={paths.root}
        aria-current={isCurrent(paths.root) ? "page" : undefined}
        className={cn(
          "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-fg-secondary outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
          isCurrent(paths.root) &&
            "bg-accent text-accent-foreground hover:bg-accent",
        )}
      >
        <LayoutGrid aria-hidden className="size-4 text-fg-muted" />
        Todos os quadros
      </Link>
      <div aria-hidden className="mx-2 my-1 h-px bg-border" />
      <BoardsBody data={data} allowCreate={false} />
    </>
  );
}

export function SidebarRail({
  data,
  onToggle,
  focusToggle,
}: {
  data: SidebarData;
  onToggle: () => void;
  focusToggle: boolean;
}) {
  const { user, workspace, workspaces } = data;
  const paths = sidebarPaths(workspace.slug);
  const isCurrent = useIsCurrentPath();

  return (
    <div className="flex h-full flex-col items-center gap-1.5 py-3.5">
      <Link
        href="/"
        aria-label="Kanbanary, seus workspaces"
        className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <LogoMark />
      </Link>
      <div className="mt-2.5">
        <ToggleButton collapsed onToggle={onToggle} takeFocus={focusToggle} />
      </div>
      <div className="my-1.5">
        <WorkspaceSwitcher
          current={workspace}
          workspaces={workspaces}
          trigger="tile"
        />
      </div>
      <RailBoards data={data} />
      <RailLink
        href={paths.members}
        label="Membros"
        current={isCurrent(paths.members)}
      >
        <Users aria-hidden />
      </RailLink>
      {workspace.canConfigure && (
        <RailLink
          href={paths.settings}
          label="Configurações"
          current={isCurrent(paths.settings)}
        >
          <Settings aria-hidden />
        </RailLink>
      )}
      <div className="mt-auto">
        <UserMenu name={user.name} email={user.email} side="right" />
      </div>
    </div>
  );
}
