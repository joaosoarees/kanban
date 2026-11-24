import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Dono",
  ADMIN: "Admin",
  MEMBER: "Membro",
};

const ROLE_STYLES: Record<Role, string> = {
  OWNER: "border-accent-border bg-accent text-brand-strong",
  ADMIN: "border-border bg-muted text-fg-secondary",
  MEMBER: "border-border bg-card text-fg-muted",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full border px-2 text-xs font-medium",
        ROLE_STYLES[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
