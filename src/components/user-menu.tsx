"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, Loader2, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsOf } from "@/lib/initials";
import { revealTheme } from "@/lib/reveal-theme";

const THEME_OPTIONS = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Escuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
] as const;

const ITEM_CLASS =
  "flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm outline-hidden select-none data-highlighted:bg-muted";

function revealOrigin(event: Event) {
  if (event instanceof MouseEvent && event.detail > 0) {
    return { x: event.clientX, y: event.clientY };
  }
  const item =
    event.target instanceof Element
      ? event.target.closest('[role="menuitemradio"]')
      : null;
  if (item === null) {
    return { x: window.innerWidth, y: 0 };
  }
  const rect = item.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function resolveTheme(choice: string) {
  if (choice !== "system") {
    return choice;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

type UserMenuProps = {
  name: string;
  email: string;
};

export function UserMenu({ name, email }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();
  const { theme = "system", resolvedTheme, setTheme } = useTheme();

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
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 pt-1.5 pb-1 text-xs text-fg-muted">
            Tema
          </DropdownMenuLabel>
          <Menu.RadioGroup
            value={theme}
            onValueChange={(value: string, details) => {
              if (resolveTheme(value) === resolvedTheme) {
                setTheme(value);
                return;
              }
              revealTheme(() => {
                setTheme(value);
              }, revealOrigin(details.event));
            }}
          >
            {THEME_OPTIONS.map(({ value, label, Icon }) => (
              <Menu.RadioItem
                key={value}
                value={value}
                closeOnClick={false}
                className={ITEM_CLASS}
              >
                <Icon aria-hidden className="size-4 text-fg-muted" />
                {label}
                <Menu.RadioItemIndicator className="ml-auto flex">
                  <Check aria-hidden className="size-4 text-brand-fg" />
                </Menu.RadioItemIndicator>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
        <DropdownMenuItem
          closeOnClick={false}
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await signOutAction();
            });
          }}
          className="h-10 cursor-pointer gap-2.5 px-2 focus:bg-muted focus:text-foreground not-data-[variant=destructive]:focus:**:text-foreground data-disabled:cursor-wait"
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
