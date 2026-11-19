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
    <div className="flex flex-col not-first:mt-6">
      <label htmlFor={id} className="text-sm leading-6 font-medium">
        {label}
      </label>
      <div className="relative mb-[5px]">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "peer block h-[43px] w-full border-0 border-b border-input bg-transparent px-0 pt-6 pb-0 text-base leading-[18px] text-foreground outline-none placeholder:text-muted-foreground aria-invalid:border-destructive",
            className,
          )}
          {...props}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] peer-focus:scale-x-100 peer-aria-invalid:bg-destructive motion-reduce:transition-none"
        />
      </div>
      <p id={errorId} className="min-h-6 text-sm leading-6 text-destructive">
        {error}
      </p>
    </div>
  );
}
