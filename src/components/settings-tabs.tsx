"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SettingsTabsProps = {
  slug: string;
  memberCount: number;
  showGeneral: boolean;
};

export function SettingsTabs({
  slug,
  memberCount,
  showGeneral,
}: SettingsTabsProps) {
  const pathname = usePathname();
  const tabs = [
    ...(showGeneral
      ? [{ href: `/w/${slug}/settings`, label: "Geral", count: null }]
      : []),
    {
      href: `/w/${slug}/settings/members`,
      label: "Membros",
      count: memberCount,
    },
  ];

  return (
    <nav
      aria-label="Seções das configurações"
      className="mt-6 flex gap-6 border-b"
    >
      {tabs.map(({ href, label, count }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex h-10 items-center gap-1.5 rounded-t-sm border-b-2 px-0.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? "border-brand text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {count !== null && (
              <span className="rounded-full bg-zinc-100 px-1.5 text-xs text-muted-foreground">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
