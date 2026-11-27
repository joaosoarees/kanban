import type { ReactNode } from "react";

type AccountCardProps = {
  id: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
};

export function AccountCard({
  id,
  title,
  description,
  children,
}: AccountCardProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4 rounded-xl border bg-card p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-[15px] font-semibold">
          {title}
        </h2>
        <p className="text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
