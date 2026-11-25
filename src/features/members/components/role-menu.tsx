"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/features/workspaces/components/role-badge";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export type AssignableRole = Exclude<Role, "OWNER">;

export function isAssignableRole(role: unknown): role is AssignableRole {
  return role === "ADMIN" || role === "MEMBER";
}

const ROLE_OPTIONS: { role: AssignableRole; description: string }[] = [
  {
    role: "ADMIN",
    description: "Adiciona e remove membros e renomeia o workspace.",
  },
  { role: "MEMBER", description: "Usa os quadros do workspace." },
];

type RoleMenuProps = {
  id?: string;
  label: string;
  value: AssignableRole;
  onChange: (role: AssignableRole) => void;
  className?: string;
};

export function RoleMenu({
  id,
  label,
  value,
  onChange,
  className,
}: RoleMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={id}
        aria-label={`${label}: ${ROLE_LABELS[value]}`}
        className={cn(
          "inline-flex h-9 w-28 cursor-pointer items-center justify-between gap-2 rounded-lg border bg-card pr-2.5 pl-3 text-[13px] font-medium outline-none hover:bg-canvas focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-popup-open:bg-muted",
          className,
        )}
      >
        {ROLE_LABELS[value]}
        <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1.5">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            if (isAssignableRole(next)) {
              onChange(next);
            }
          }}
        >
          {ROLE_OPTIONS.map(({ role, description }) => (
            <DropdownMenuRadioItem
              key={role}
              value={role}
              closeOnClick
              className="cursor-pointer items-start rounded-md py-2 pr-8 pl-2"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
                <span className="text-[13px]/snug text-muted-foreground">
                  {description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
