"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronsUpDown, LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";
import { WorkspaceTile } from "@/features/workspaces/components/workspace-tile";
import { cn } from "@/lib/utils";

export type SwitcherWorkspace = { id: string; name: string; slug: string };

const ITEM_CLASS =
  "flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm outline-hidden select-none focus:bg-accent data-highlighted:bg-accent";

type WorkspaceSwitcherProps = {
  current: SwitcherWorkspace;
  workspaces: SwitcherWorkspace[];
  trigger: "card" | "tile";
};

export function WorkspaceSwitcher({
  current,
  workspaces,
  trigger,
}: WorkspaceSwitcherProps) {
  const pathname = usePathname();
  const [dialogPath, setDialogPath] = useState<string | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Workspace atual: ${current.name}. Trocar de workspace`}
          className={cn(
            "flex shrink-0 cursor-pointer items-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            trigger === "card"
              ? "h-12 w-full gap-2.5 rounded-lg border px-2 text-left hover:border-border-strong data-popup-open:border-border-strong data-popup-open:bg-muted"
              : "size-9 justify-center rounded-lg hover:bg-muted data-popup-open:bg-muted",
          )}
        >
          <WorkspaceTile
            name={current.name}
            slug={current.slug}
            className="size-7 rounded-md text-[13px]"
          />
          {trigger === "card" && (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {current.name}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  /w/{current.slug}
                </span>
              </span>
              <ChevronsUpDown
                aria-hidden
                className="size-3.5 shrink-0 text-muted-foreground"
              />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={trigger === "card" ? "bottom" : "right"}
          align="start"
          className="w-[min(280px,calc(100vw-24px))] p-1.5"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1.5">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((workspace) => {
              const isCurrent = workspace.id === current.id;
              return (
                <Menu.LinkItem
                  key={workspace.id}
                  render={<Link href={`/w/${workspace.slug}`} />}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    ITEM_CLASS,
                    "h-12",
                    isCurrent
                      ? "bg-accent focus:bg-accent data-highlighted:bg-accent"
                      : "focus:bg-muted data-highlighted:bg-muted",
                  )}
                >
                  <WorkspaceTile
                    name={workspace.name}
                    slug={workspace.slug}
                    className="size-[22px] rounded-[5px] text-[11px]"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn("truncate", isCurrent && "font-medium")}
                    >
                      {workspace.name}
                    </span>
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      /w/{workspace.slug}
                    </span>
                  </span>
                  {isCurrent && (
                    <Check aria-hidden className="size-4 text-brand-fg" />
                  )}
                </Menu.LinkItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
          <DropdownMenuItem
            onClick={() => {
              setDialogPath(pathname);
            }}
            className={ITEM_CLASS}
          >
            <span className="flex size-[22px] items-center justify-center rounded-[5px] border border-dashed border-border-control">
              <Plus aria-hidden className="size-3.5 text-fg-muted" />
            </span>
            Novo workspace
          </DropdownMenuItem>
          <Menu.LinkItem render={<Link href="/" />} className={ITEM_CLASS}>
            <span className="flex w-[22px] justify-center">
              <LayoutGrid aria-hidden className="size-4 text-fg-muted" />
            </span>
            Todos os workspaces
          </Menu.LinkItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateWorkspaceDialog
        key={pathname}
        open={dialogPath === pathname}
        onOpenChange={(open) => {
          setDialogPath(open ? pathname : null);
        }}
      />
    </>
  );
}
