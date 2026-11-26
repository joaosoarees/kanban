import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded border border-border-control bg-card text-on-color",
        checked && "border-brand bg-brand",
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}
