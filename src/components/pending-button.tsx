import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingButtonProps = ComponentProps<typeof Button> & {
  isPending: boolean;
  pendingLabel: string;
};

export function PendingButton({
  isPending,
  pendingLabel,
  disabled,
  className,
  children,
  ...props
}: PendingButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled === true || isPending}
      aria-busy={isPending || undefined}
      data-pending={isPending || undefined}
      className={cn(
        "relative disabled:data-pending:cursor-wait disabled:data-pending:opacity-100",
        className,
      )}
    >
      <span className={cn("contents", isPending && "invisible")}>
        {children}
      </span>
      {isPending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2
            aria-hidden
            className="animate-spin motion-reduce:animate-none"
          />
          <span className="sr-only">{pendingLabel}</span>
        </span>
      )}
    </Button>
  );
}
