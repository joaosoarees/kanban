"use client";

import {
  useState,
  useTransition,
  type BaseSyntheticEvent,
  type ReactNode,
} from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { dangerButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import type { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/run-action";
import { cn } from "@/lib/utils";

const CONFIRM_FAILED = "Não foi possível concluir. Tente de novo.";
const CONFIRMED: ActionResult = { status: "success", data: undefined };

type ConfirmForm = {
  submit: (event?: BaseSyntheticEvent) => void;
  isPending: boolean;
  error?: string;
};

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  children?: ReactNode;
} & (
  | {
      onConfirm: () => Promise<ActionResult> | ActionResult | undefined;
      form?: never;
    }
  | { form: ConfirmForm; onConfirm?: never }
);

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancelar",
  confirmDisabled = false,
  onConfirm,
  form,
  children,
}: ConfirmDialogProps) {
  const [isConfirming, startTransition] = useTransition();
  const [confirmError, setError] = useState<string>();
  const isPending = form?.isPending ?? isConfirming;
  const error = form ? form.error : confirmError;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) {
      return;
    }
    setError(undefined);
    onOpenChange(nextOpen);
  };

  const confirm = () => {
    if (onConfirm === undefined) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await runAction(
        async () => (await onConfirm()) ?? CONFIRMED,
        CONFIRM_FAILED,
      );
      if (result.status === "error") {
        setError(result.message);
      }
    });
  };

  const body = (
    <>
      {children}
      <div role="alert" className="empty:hidden">
        {error !== undefined && (
          <p className="mt-4 rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-text">
            {error}
          </p>
        )}
      </div>
      <AlertDialogFooter className="mx-0 mt-5 mb-0 border-0 bg-transparent p-0">
        <AlertDialogCancel disabled={isPending} className="h-10 px-4">
          {cancelLabel}
        </AlertDialogCancel>
        <PendingButton
          type={form ? "submit" : "button"}
          onClick={form ? undefined : confirm}
          disabled={confirmDisabled}
          isPending={isPending}
          pendingLabel={pendingLabel}
          className={cn("h-10 px-4", dangerButton)}
        >
          {confirmLabel}
        </PendingButton>
      </AlertDialogFooter>
    </>
  );

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="gap-0 p-6 data-[size=default]:sm:max-w-[440px]">
        <AlertDialogHeader className="gap-2">
          <AlertDialogTitle className="text-lg font-semibold tracking-tight text-balance">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm/relaxed text-pretty">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {form ? (
          <form onSubmit={form.submit} noValidate aria-busy={isPending}>
            {body}
          </form>
        ) : (
          body
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
