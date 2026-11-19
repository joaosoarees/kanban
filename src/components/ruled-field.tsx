import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type RuledFieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  error?: string;
};

export function RuledField({
  id,
  label,
  error,
  className,
  ...props
}: RuledFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm leading-6 font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "mb-[5px] h-[43px] w-full border-0 border-b border-input bg-transparent px-0 pt-6 pb-0 text-base leading-[18px] text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-b-2 focus:border-ink aria-invalid:border-destructive",
          className,
        )}
        {...props}
      />
      <p id={errorId} className="min-h-6 text-sm leading-6 text-destructive">
        {error}
      </p>
    </div>
  );
}
