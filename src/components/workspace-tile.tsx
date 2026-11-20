import { firstCharacter } from "@/lib/initials";
import { cn } from "@/lib/utils";

const TILE_COLORS = [
  "bg-indigo-600",
  "bg-teal-700",
  "bg-amber-700",
  "bg-rose-700",
  "bg-sky-700",
  "bg-violet-700",
  "bg-emerald-700",
];

function colorFor(slug: string): string {
  let hash = 0;
  for (const char of slug) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return TILE_COLORS[hash % TILE_COLORS.length];
}

type WorkspaceTileProps = {
  name: string;
  slug: string;
  className?: string;
};

export function WorkspaceTile({ name, slug, className }: WorkspaceTileProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md text-[13px] font-semibold text-white",
        colorFor(slug),
        className,
      )}
    >
      {firstCharacter(name)}
    </span>
  );
}
