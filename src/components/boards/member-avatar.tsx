import { UserRound } from "lucide-react";
import { initialsOf } from "@/lib/initials";

export function MemberAvatar({ name }: { name: string | null }) {
  if (name === null) {
    return (
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-400 bg-white text-zinc-600"
      >
        <UserRound className="size-[13px]" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-brand-strong"
    >
      {initialsOf(name)}
    </span>
  );
}
