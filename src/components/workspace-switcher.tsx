"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronsUpDown, LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkspaceTile } from "@/components/workspace-tile";
import { cn } from "@/lib/utils";

type SwitcherWorkspace = { id: string; name: string; slug: string };

const ITEM_CLASS =
  "flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm outline-hidden select-none focus:bg-accent data-highlighted:bg-accent";

export function WorkspaceSwitcher({
  workspaces,
}: {
  workspaces: SwitcherWorkspace[];
}) {
  const params = useParams<{ slug?: string }>();
  const pathname = usePathname();
  const [dialogPath, setDialogPath] = useState<string | null>(null);

  const current = workspaces.find(({ slug }) => slug === params.slug);
  if (!current) return null;

  return (
    <>
      <span aria-hidden className="text-xl font-light text-zinc-300">
        /
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Workspace atual: ${current.name}. Trocar de workspace`}
          className="flex h-9 min-w-0 cursor-pointer items-center gap-2 rounded-lg pr-2 pl-1.5 text-sm font-medium outline-none hover:bg-zinc-100 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-zinc-100"
        >
          <WorkspaceTile
            name={current.name}
            slug={current.slug}
            className="size-[22px] rounded-[5px] text-[11px]"
          />
          <span className="max-w-40 truncate sm:max-w-72">{current.name}</span>
          <ChevronsUpDown
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[min(280px,calc(100vw-24px))] p-1.5">
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
                  className={cn(ITEM_CLASS, isCurrent && "bg-zinc-100")}
                >
                  <WorkspaceTile
                    name={workspace.name}
                    slug={workspace.slug}
                    className="size-[22px] rounded-[5px] text-[11px]"
                  />
                  <span
                    className={cn(
                      "flex-1 truncate",
                      isCurrent && "font-medium",
                    )}
                  >
                    {workspace.name}
                  </span>
                  {isCurrent && (
                    <Check aria-hidden className="size-4 text-brand" />
                  )}
                </Menu.LinkItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
          <DropdownMenuItem
            onClick={() => setDialogPath(pathname)}
            className={ITEM_CLASS}
          >
            <span className="flex size-[22px] items-center justify-center rounded-[5px] border border-dashed border-zinc-400">
              <Plus aria-hidden className="size-3.5 text-zinc-600" />
            </span>
            Novo workspace
          </DropdownMenuItem>
          <Menu.LinkItem render={<Link href="/" />} className={ITEM_CLASS}>
            <span className="flex w-[22px] justify-center">
              <LayoutGrid aria-hidden className="size-4 text-zinc-600" />
            </span>
            Todos os workspaces
          </Menu.LinkItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateWorkspaceDialog
        open={dialogPath === pathname}
        onOpenChange={(open) => setDialogPath(open ? pathname : null)}
      />
    </>
  );
}
