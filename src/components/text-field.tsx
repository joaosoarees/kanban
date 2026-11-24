"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TextFieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  labelClassName?: string;
  hint?: ReactNode;
  error?: ReactNode;
};

export function TextField({
  id,
  label,
  labelClassName,
  hint,
  error,
  type,
  ...props
}: TextFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const hasError = error !== undefined;
  const messageId =
    hasError || hint !== undefined ? `${id}-message` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && isPasswordVisible ? "text" : type}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={messageId}
          className={cn(
            "h-10 enabled:hover:border-border-strong aria-invalid:enabled:hover:border-destructive",
            isPassword && "pr-11",
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => {
              setIsPasswordVisible((visible) => !visible);
            }}
            aria-label="Mostrar senha"
            aria-pressed={isPasswordVisible}
            aria-controls={id}
            className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r-lg text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPasswordVisible ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </button>
        )}
      </div>
      <p
        id={messageId}
        aria-live="polite"
        className={cn(
          "min-h-5 text-[13px]/5 text-pretty",
          hasError ? "text-danger-text" : "text-muted-foreground",
        )}
      >
        {error ?? hint}
      </p>
    </div>
  );
}
