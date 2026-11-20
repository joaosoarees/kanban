import Link from "next/link";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { cn } from "@/lib/utils";

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
      <PendingButton
        type="submit"
        isPending={isPending}
        pendingLabel={pendingLabel}
        className={cn("h-10 w-full", primaryButton)}
      >
        {submitLabel}
      </PendingButton>
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
