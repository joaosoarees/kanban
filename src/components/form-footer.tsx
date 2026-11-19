import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type FormFooterProps = {
  error?: string;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  switchText: string;
  switchHref: string;
  switchLabel: string;
};

export function FormFooter({
  error,
  isPending,
  submitLabel,
  pendingLabel,
  switchText,
  switchHref,
  switchLabel,
}: FormFooterProps) {
  return (
    <>
      <div role="alert">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="h-10 w-full enabled:hover:bg-brand-strong disabled:cursor-wait disabled:opacity-100"
      >
        {isPending && (
          <Loader2
            aria-hidden
            className="animate-spin motion-reduce:animate-none"
          />
        )}
        {isPending ? pendingLabel : submitLabel}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {switchText}{" "}
        <Link
          href={switchHref}
          className="rounded-sm font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {switchLabel}
        </Link>
      </p>
    </>
  );
}
