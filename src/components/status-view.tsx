import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusViewProps = {
  icon: LucideIcon;
  tone?: "brand" | "danger";
  eyebrow?: string;
  title: string;
  description: string;
  actions: ReactNode;
};

export function StatusView({
  icon: Icon,
  tone = "brand",
  eyebrow,
  title,
  description,
  actions,
}: StatusViewProps) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2.5 px-6 pt-24 text-center">
      <span
        className={cn(
          "mb-2 flex size-12 items-center justify-center rounded-xl",
          tone === "danger" ? "bg-danger-bg" : "bg-accent",
        )}
      >
        <Icon
          aria-hidden
          className={cn(
            "size-[22px]",
            tone === "danger" ? "text-danger-text" : "text-brand-fg",
          )}
        />
      </span>
      {eyebrow !== undefined && (
        <p className="font-mono text-[13px] text-muted-foreground">{eyebrow}</p>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-md text-sm/relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>
    </main>
  );
}
