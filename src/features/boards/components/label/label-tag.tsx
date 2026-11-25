import type { LabelColor } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  GRAY: "bg-label-gray-bg text-label-gray-fg",
  RED: "bg-label-red-bg text-label-red-fg",
  ORANGE: "bg-label-orange-bg text-label-orange-fg",
  YELLOW: "bg-label-yellow-bg text-label-yellow-fg",
  GREEN: "bg-label-green-bg text-label-green-fg",
  TEAL: "bg-label-teal-bg text-label-teal-fg",
  BLUE: "bg-label-blue-bg text-label-blue-fg",
  PURPLE: "bg-label-purple-bg text-label-purple-fg",
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
