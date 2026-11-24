"use client";

import { Loader2, LogOut } from "lucide-react";
import { useTransition } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsOf } from "@/lib/initials";

type UserMenuProps = {
  name: string;
  email: string;
};

export function UserMenu({ name, email }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Conta de ${name}`}
        className="group flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-accent-strong text-[13px] font-semibold text-accent-foreground group-data-popup-open:ring-3 group-data-popup-open:ring-ring/30">
          {initialsOf(name)}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1.5">
        <div className="flex flex-col p-2">
          <span className="truncate text-sm font-medium">{name}</span>
          <span className="truncate text-[13px] text-muted-foreground">
            {email}
          </span>
        </div>
        <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
        <DropdownMenuItem
          closeOnClick={false}
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await signOutAction();
            });
          }}
          className="h-10 cursor-pointer gap-2.5 px-2 data-disabled:cursor-wait"
        >
          {isPending ? (
            <Loader2
              aria-hidden
              className="animate-spin text-fg-muted motion-reduce:animate-none"
            />
          ) : (
            <LogOut aria-hidden className="text-fg-muted" />
          )}
          {isPending ? "Saindo…" : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
