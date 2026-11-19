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
        className="mt-[18px] h-12 w-full text-base hover:bg-ink-strong disabled:bg-ink-muted disabled:opacity-100"
      >
        {isPending ? pendingLabel : submitLabel}
      </Button>
      <p className="mt-[30px] text-sm leading-6 text-muted-foreground">
        {switchText}{" "}
        <Link
          href={switchHref}
          className="font-medium text-ink underline decoration-ink decoration-1 underline-offset-[1px] hover:text-ink-strong"
        >
          {switchLabel}
        </Link>
      </p>
    </>
  );
}
