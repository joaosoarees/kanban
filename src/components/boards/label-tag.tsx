import type { LabelColor } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  GRAY: "bg-zinc-200 text-zinc-700",
  RED: "bg-red-100 text-red-800",
  ORANGE: "bg-orange-100 text-orange-800",
  YELLOW: "bg-amber-100 text-yellow-800",
  GREEN: "bg-green-100 text-green-800",
  TEAL: "bg-teal-100 text-teal-800",
  BLUE: "bg-blue-100 text-blue-800",
  PURPLE: "bg-purple-100 text-purple-800",
};

type LabelTagProps = {
  name: string;
  color: LabelColor;
  className?: string;
};

export function LabelTag({ name, color, className }: LabelTagProps) {
  return (
    <span
      className={cn(
        "inline-block h-[22px] max-w-full truncate rounded-[5px] px-[7px] text-[13px]/[22px] font-medium",
        LABEL_COLOR_CLASSES[color],
        className,
      )}
    >
      {name}
    </span>
  );
}
