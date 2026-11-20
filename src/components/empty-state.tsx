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
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
      <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-indigo-50">
        <Icon aria-hidden className="size-[22px] text-brand" />
      </span>
      <Heading className="text-base font-semibold">{title}</Heading>
      <p className="max-w-sm text-sm/relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
