"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { useRef, useState, type RefObject } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const SIDEBAR_ITEM =
  "relative flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-fg-secondary outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-fg-muted";

export const SIDEBAR_ITEM_CURRENT =
  "bg-accent text-accent-foreground hover:bg-accent [&>svg]:text-brand-fg";

export function revealInScrollArea(link: HTMLElement | null) {
  const scrollArea = link?.closest<HTMLElement>("[data-sidebar-scroll]");
  if (!link || !scrollArea) {
    return;
  }
  const area = scrollArea.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();
  if (linkBox.top < area.top || linkBox.bottom > area.bottom) {
    scrollArea.scrollTop +=
      linkBox.top - area.top - (area.height - linkBox.height) / 2;
  }
}

export function revealCurrentLink(scrollArea: HTMLElement | null) {
  revealInScrollArea(
    scrollArea?.querySelector<HTMLElement>('[aria-current="page"]') ?? null,
  );
}

type SidebarLinkProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  current: boolean;
};

export function SidebarLink({
  href,
  icon: Icon,
  label,
  current,
}: SidebarLinkProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [isTipOpen, setIsTipOpen] = useState(false);

  return (
    <Tooltip
      open={isTipOpen}
      onOpenChange={(open) => {
        const labelElement = labelRef.current;
        setIsTipOpen(
          open &&
            labelElement !== null &&
            labelElement.scrollWidth > labelElement.clientWidth,
        );
      }}
    >
      <TooltipTrigger
        render={
          <Link
            ref={current ? revealInScrollArea : undefined}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(SIDEBAR_ITEM, current && SIDEBAR_ITEM_CURRENT)}
          />
        }
      >
        <PendingHighlight />
        <Icon aria-hidden className="relative" />
        <LinkLabel labelRef={labelRef} label={label} />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function PendingHighlight() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-0 rounded-md bg-accent opacity-0",
        pending && "opacity-100",
      )}
    />
  );
}

function LinkLabel({
  labelRef,
  label,
}: {
  labelRef: RefObject<HTMLSpanElement | null>;
  label: string;
}) {
  const { pending } = useLinkStatus();
  return (
    <>
      <span
        ref={labelRef}
        className={cn("relative min-w-0 flex-1 truncate", pending && "pr-5")}
      >
        {label}
      </span>
      {pending && (
        <Loader2
          aria-hidden
          className="absolute right-2.5 size-3.5! animate-spin motion-reduce:animate-none"
        />
      )}
    </>
  );
}

export const ICON_BUTTON =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-muted outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted [&>svg]:size-[18px]";

export const ICON_BUTTON_CURRENT =
  "bg-accent text-brand-fg hover:bg-accent hover:text-brand-fg";

export const DESKTOP_QUERY = "(min-width: 64rem)";
