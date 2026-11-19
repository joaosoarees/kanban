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
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={isPending}
        className="h-10 w-full hover:bg-brand-strong"
      >
        {isPending ? pendingLabel : submitLabel}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {switchText}{" "}
        <Link
          href={switchHref}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          {switchLabel}
        </Link>
      </p>
    </>
  );
}
