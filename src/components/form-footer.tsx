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
      <p role="alert" className="min-h-6 text-sm leading-6 text-destructive">
        {error}
      </p>
      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full text-base"
      >
        {isPending ? pendingLabel : submitLabel}
      </Button>
      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        {switchText}{" "}
        <Link
          href={switchHref}
          className="font-medium text-ink underline decoration-rule decoration-2 underline-offset-4 hover:decoration-ink"
        >
          {switchLabel}
        </Link>
      </p>
    </>
  );
}
