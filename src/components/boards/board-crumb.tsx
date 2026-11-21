"use client";

import { usePathname } from "next/navigation";

type BoardCrumbProps = {
  href: string;
  name: string;
};

export function BoardCrumb({ href, name }: BoardCrumbProps) {
  if (usePathname() !== href) {
    return null;
  }

  return (
    <span className="hidden min-w-0 items-center gap-2 sm:flex">
      <span aria-hidden className="text-xl font-light text-zinc-300">
        /
      </span>
      <span
        aria-current="page"
        className="max-w-[360px] truncate text-sm font-medium text-zinc-700"
      >
        {name}
      </span>
    </span>
  );
}
