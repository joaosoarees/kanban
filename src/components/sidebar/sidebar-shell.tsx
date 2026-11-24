"use client";

import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { LogoMark } from "@/components/logo";
import { CloseDrawerButton, MobileBar } from "@/components/sidebar/mobile-bar";
import { DESKTOP_QUERY } from "@/components/sidebar/sidebar-links";
import {
  SidebarPanel,
  type SidebarData,
} from "@/components/sidebar/sidebar-panel";
import { SidebarRail } from "@/components/sidebar/sidebar-rail";
import { ToggleButton } from "@/components/sidebar/sidebar-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSidebar } from "@/stores/sidebar";
import { cn } from "@/lib/utils";

const IGNORED_SHORTCUT_TARGETS =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

function useSidebarPreference() {
  const collapsed = useSidebar((state) => state.collapsed);
  const hasToggled = useSidebar((state) => state.hasToggled);
  const toggle = useSidebar((state) => state.toggle);

  useLayoutEffect(() => {
    const { persist } = useSidebar;
    void persist.rehydrate();

    const syncFromOtherTab = (event: StorageEvent) => {
      if (event.key === null || event.key === persist.getOptions().name) {
        void persist.rehydrate();
      }
    };
    window.addEventListener("storage", syncFromOtherTab);
    return () => {
      window.removeEventListener("storage", syncFromOtherTab);
    };
  }, []);

  return { collapsed, hasToggled, toggle };
}

function useToggleShortcut(toggle: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "[" ||
        event.repeat ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        !window.matchMedia(DESKTOP_QUERY).matches
      ) {
        return;
      }
      if (
        event.target instanceof Element &&
        event.target.closest(IGNORED_SHORTCUT_TARGETS)
      ) {
        return;
      }
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [toggle]);
}

function DesktopFrame({
  collapsed,
  animate,
  children,
}: {
  collapsed: boolean;
  animate: boolean;
  children: ReactNode;
}) {
  return (
    <aside
      aria-label="Navegação do workspace"
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 overflow-hidden border-r bg-card lg:block",
        collapsed ? "w-14" : "w-66",
        animate &&
          (collapsed
            ? "transition-[width] duration-100 ease-out motion-reduce:transition-none"
            : "transition-[width] duration-160 ease-out motion-reduce:transition-none"),
      )}
    >
      <div className={cn("h-full", collapsed ? "w-14" : "w-66")}>
        {children}
      </div>
    </aside>
  );
}

export function SidebarShell({ data }: { data: SidebarData }) {
  const { collapsed, hasToggled, toggle } = useSidebarPreference();
  useToggleShortcut(toggle);

  return (
    <TooltipProvider delay={300}>
      <MobileBar
        workspace={data.workspace}
        drawer={
          <SidebarPanel data={data} headerAction={<CloseDrawerButton />} />
        }
      />
      <DesktopFrame collapsed={collapsed} animate={hasToggled}>
        {collapsed ? (
          <SidebarRail data={data} onToggle={toggle} />
        ) : (
          <SidebarPanel
            data={data}
            headerAction={<ToggleButton collapsed={false} onToggle={toggle} />}
          />
        )}
      </DesktopFrame>
    </TooltipProvider>
  );
}

const SKELETON_WIDTHS = [
  "w-36",
  "w-44",
  "w-28",
  "w-40",
  "w-32",
  "w-48",
  "w-24",
];

export function SidebarSkeleton() {
  const { collapsed } = useSidebarPreference();

  return (
    <>
      <MobileBar workspace={null} drawer={null} />
      <DesktopFrame collapsed={collapsed} animate={false}>
        <output className="flex h-full flex-col">
          <span className="sr-only">Carregando a navegação…</span>
          {collapsed ? (
            <div
              aria-hidden
              className="flex flex-col items-center gap-3 py-3.5"
            >
              <LogoMark />
              <Skeleton className="mt-2.5 size-9 rounded-lg bg-muted-strong" />
              <Skeleton className="size-7 rounded-md bg-muted-strong" />
              <Skeleton className="size-9 rounded-lg bg-muted-strong" />
              <Skeleton className="size-9 rounded-lg bg-muted-strong" />
            </div>
          ) : (
            <div aria-hidden className="flex h-full flex-col">
              <div className="flex h-14 shrink-0 items-center gap-2 pl-4">
                <LogoMark />
                <span className="text-base font-semibold tracking-tight">
                  Kanbanary
                </span>
              </div>
              <div className="px-2 pt-2">
                <Skeleton className="h-12 rounded-lg bg-muted-strong" />
              </div>
              <div className="flex flex-col gap-0.5 px-2 pt-13">
                {SKELETON_WIDTHS.map((width) => (
                  <div
                    key={width}
                    className="flex h-9 items-center gap-2.5 px-2.5"
                  >
                    <Skeleton className="size-4 rounded-sm bg-muted-strong" />
                    <Skeleton
                      className={cn("h-3 rounded-sm bg-muted-strong", width)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </output>
      </DesktopFrame>
    </>
  );
}
