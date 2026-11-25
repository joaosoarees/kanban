import Link from "next/link";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { cn } from "@/lib/utils";

type FormFooterProps = {
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  switchText: string;
  switchHref: string;
  switchLabel: string;
};

export function FormFooter({
  isPending,
  submitLabel,
  pendingLabel,
  switchText,
  switchHref,
  switchLabel,
}: FormFooterProps) {
  return (
    <>
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
          className="rounded-sm font-medium text-brand-fg underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {switchLabel}
        </Link>
      </p>
    </>
  );
}
