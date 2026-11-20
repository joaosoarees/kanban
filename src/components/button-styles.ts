import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const primaryButton =
  "enabled:hover:bg-brand-strong enabled:active:bg-brand-deep";

export const dangerButton =
  "bg-red-600 text-white enabled:hover:bg-red-700 enabled:active:bg-red-800";

export const dangerOutlineButton =
  "border-red-200 text-red-700 enabled:hover:bg-red-50 enabled:hover:text-red-700 enabled:active:bg-red-100";

export const rowButton =
  "h-8 px-2.5 text-[13px] text-zinc-700 enabled:hover:border-red-200 enabled:hover:bg-red-50 enabled:hover:text-red-700";

export function linkButton(variant: "default" | "outline", className?: string) {
  return cn(
    buttonVariants({ variant }),
    variant === "outline"
      ? "hover:bg-muted hover:text-foreground"
      : "hover:bg-brand-strong active:bg-brand-deep",
    className,
  );
}
