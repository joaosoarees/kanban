import type { ReactNode } from "react";

export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm/[22px] wrap-anywhere text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
