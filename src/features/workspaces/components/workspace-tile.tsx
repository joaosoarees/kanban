import { firstCharacter } from "@/lib/initials";
import { cn } from "@/lib/utils";

const TILE_COLORS = [
  "bg-identity-indigo",
  "bg-identity-teal",
  "bg-identity-amber",
  "bg-identity-rose",
  "bg-identity-sky",
  "bg-identity-violet",
  "bg-identity-emerald",
];

function colorFor(slug: string): string {
  let hash = 0;
  for (const char of slug) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 2 ** 32;
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
        "flex size-7 shrink-0 items-center justify-center rounded-md text-[13px] font-semibold text-on-color",
        colorFor(slug),
        className,
      )}
    >
      {firstCharacter(name)}
    </span>
  );
}
