import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  headingLevel?: "h2" | "h3";
  action?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  headingLevel: Heading = "h2",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong bg-card px-6 py-16 text-center">
      <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-accent">
        <Icon aria-hidden className="size-[22px] text-brand-fg" />
      </span>
      <Heading className="text-base font-semibold">{title}</Heading>
      <p className="max-w-sm text-sm/relaxed text-muted-foreground">
        {description}
      </p>
      {action !== undefined && <div className="mt-4">{action}</div>}
    </div>
  );
}
