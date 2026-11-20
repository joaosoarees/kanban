import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Dono",
  ADMIN: "Admin",
  MEMBER: "Membro",
};

const ROLE_STYLES: Record<Role, string> = {
  OWNER: "border-indigo-200 bg-indigo-50 text-brand-strong",
  ADMIN: "border-zinc-200 bg-zinc-100 text-zinc-700",
  MEMBER: "border-zinc-200 bg-white text-zinc-600",
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
