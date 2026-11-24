import { UserRound } from "lucide-react";
import { initialsOf } from "@/lib/initials";

export function MemberAvatar({ name }: { name: string | null }) {
  if (name === null) {
    return (
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border-control bg-card text-fg-muted"
      >
        <UserRound className="size-[13px]" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-strong text-[11px] font-semibold text-accent-foreground"
    >
      {initialsOf(name)}
    </span>
  );
}
