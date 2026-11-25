"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu as MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { DESKTOP_QUERY, ICON_BUTTON } from "@/components/sidebar/sidebar-links";
import {
  sidebarPaths,
  type SidebarData,
} from "@/components/sidebar/sidebar-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceTile } from "@/features/workspaces/components/workspace-tile";
import { cn } from "@/lib/utils";

export function MobileBar({
  workspace,
  drawer,
}: {
  workspace: SidebarData["workspace"] | null;
  drawer: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const closeOnDesktop = () => {
      if (desktop.matches) {
        setOpen(false);
      }
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  const close = () => {
    setOpen(false);
  };

  return (
    <div className="flex h-14 shrink-0 items-center gap-1.5 border-b bg-card pr-3 pl-1 lg:hidden">
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger
          aria-label="Abrir navegação"
          disabled={drawer === null}
          className={cn(ICON_BUTTON, "size-11 [&>svg]:size-5")}
        >
          <MenuIcon aria-hidden />
        </DialogPrimitive.Trigger>
        {drawer !== null && (
          <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop
              data-slot="dialog-overlay"
              className="fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs lg:hidden data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
            />
            <DialogPrimitive.Popup
              data-slot="sidebar-drawer"
              className="fixed inset-y-0 left-0 z-50 w-[min(312px,calc(100vw-3rem))] bg-card shadow-lg ring-1 ring-foreground/10 outline-none lg:hidden data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left"
              onClickCapture={(event) => {
                if (
                  event.target instanceof Element &&
                  event.target.closest("a")
                ) {
                  close();
                }
              }}
            >
              <DialogPrimitive.Title className="sr-only">
                Navegação do workspace
              </DialogPrimitive.Title>
              {drawer}
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        )}
      </DialogPrimitive.Root>
      {workspace === null ? (
        <Skeleton className="h-4 w-40 bg-muted-strong" />
      ) : (
        <Link
          href={sidebarPaths(workspace.slug).root}
          className="flex min-w-0 items-center gap-2 rounded-md text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <WorkspaceTile
            name={workspace.name}
            slug={workspace.slug}
            className="size-[22px] rounded-[5px] text-[11px]"
          />
          <span className="truncate">{workspace.name}</span>
        </Link>
      )}
    </div>
  );
}

export function CloseDrawerButton() {
  return (
    <DialogPrimitive.Close
      aria-label="Fechar navegação"
      className={cn(ICON_BUTTON, "size-11 [&>svg]:size-5")}
    >
      <X aria-hidden />
    </DialogPrimitive.Close>
  );
}
