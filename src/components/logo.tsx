import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-7 items-end gap-0.5 rounded-md bg-brand p-1.5",
        className,
      )}
    >
      <span className="h-full flex-1 rounded-[1px] bg-white" />
      <span className="h-2/3 flex-1 rounded-[1px] bg-white" />
      <span className="h-2/5 flex-1 rounded-[1px] bg-white" />
    </span>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-base font-semibold tracking-tight">Kanbanary</span>
    </span>
  );
}
