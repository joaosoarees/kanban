import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const primaryButton =
  "enabled:hover:bg-brand-strong enabled:active:bg-brand-deep";

export const dangerButton =
  "bg-destructive text-on-color enabled:hover:bg-destructive-strong enabled:active:bg-destructive-deep";

export const dangerOutlineButton =
  "border-danger-border text-danger-text enabled:hover:bg-danger-bg enabled:hover:text-danger-text enabled:active:bg-danger-bg-strong";

export const rowButton =
  "h-8 px-2.5 text-[13px] text-fg-secondary enabled:hover:border-danger-border enabled:hover:bg-danger-bg enabled:hover:text-danger-text";

export function linkButton(variant: "default" | "outline", className?: string) {
  return cn(
    buttonVariants({ variant }),
    variant === "outline"
      ? "hover:bg-muted hover:text-foreground"
      : "hover:bg-brand-strong active:bg-brand-deep",
    className,
  );
}
