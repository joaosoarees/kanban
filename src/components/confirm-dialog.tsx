"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
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
import { cn } from "@/lib/utils";

const CONFIRM_FAILED = "Não foi possível concluir. Tente de novo.";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  onConfirm: () => Promise<ActionResult> | ActionResult | undefined;
  children?: ReactNode;
};

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
  children,
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) {
      return;
    }
    setError(undefined);
    onOpenChange(nextOpen);
  };

  const confirm = () => {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await onConfirm();
        if (result?.status === "error") {
          setError(result.message);
        }
      } catch (caught) {
        unstable_rethrow(caught);
        console.error(caught);
        setError(CONFIRM_FAILED);
      }
    });
  };

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
        {children}
        <div role="alert" className="empty:hidden">
          {error !== undefined && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
        <AlertDialogFooter className="mx-0 mt-5 mb-0 border-0 bg-transparent p-0">
          <AlertDialogCancel disabled={isPending} className="h-10 px-4">
            {cancelLabel}
          </AlertDialogCancel>
          <PendingButton
            onClick={confirm}
            disabled={confirmDisabled}
            isPending={isPending}
            pendingLabel={pendingLabel}
            className={cn("h-10 px-4", dangerButton)}
          >
            {confirmLabel}
          </PendingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
