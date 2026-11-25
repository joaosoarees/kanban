"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { linkButton, primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BOARD_NAME_MAX_LENGTH,
  boardNameSchema,
} from "@/features/boards/schemas";
import { useActionForm } from "@/hooks/use-action-form";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

const SAVE_FAILED = "Não foi possível salvar o quadro. Tente de novo.";

type BoardNameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  defaultName: string;
  submitLabel: string;
  pendingLabel: string;
  boardsHref: string;
  submit: (values: { name: string }) => Promise<ActionResult>;
};

export function BoardNameDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultName,
  submitLabel,
  pendingLabel,
  boardsHref,
  submit: save,
}: BoardNameDialogProps) {
  const [isGone, setIsGone] = useState(false);
  const {
    form: {
      register,
      reset,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: boardNameSchema,
    defaultValues: { name: defaultName },
    action: save,
    failure: SAVE_FAILED,
    onSuccess: () => {
      onOpenChange(false);
    },
    onError: (error) => {
      setIsGone(error.gone === true);
    },
  });

  useEffect(() => {
    if (open) {
      reset({ name: defaultName });
    }
  }, [open, defaultName, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) {
          return;
        }
        if (!nextOpen) {
          setIsGone(false);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-0 p-6 sm:max-w-[440px]"
      >
        <DialogHeader className="gap-1.5 pr-8">
          <DialogTitle className="text-lg font-semibold tracking-tight text-balance">
            {title}
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={submit}
          noValidate
          aria-busy={isPending}
          className="mt-5"
        >
          <fieldset
            disabled={isPending || isGone}
            className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
          >
            <TextField
              id="board-name"
              required
              label="Nome"
              autoComplete="off"
              maxLength={BOARD_NAME_MAX_LENGTH}
              hint={`Até ${BOARD_NAME_MAX_LENGTH} caracteres.`}
              error={errors.name?.message}
              {...register("name")}
            />
          </fieldset>
          <div role="alert" className="empty:hidden">
            {errors.root?.message !== undefined && (
              <p className="mt-2 rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-text">
                {errors.root.message}
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {isGone ? (
              <Link
                href={boardsHref}
                className={linkButton("default", "h-10 px-4")}
              >
                Voltar aos quadros
              </Link>
            ) : (
              <>
                <DialogClose
                  disabled={isPending}
                  render={<Button variant="outline" className="h-10 px-4" />}
                >
                  Cancelar
                </DialogClose>
                <PendingButton
                  type="submit"
                  isPending={isPending}
                  pendingLabel={pendingLabel}
                  className={cn("h-10 px-4", primaryButton)}
                >
                  {submitLabel}
                </PendingButton>
              </>
            )}
          </div>
        </form>
        <DialogClose
          aria-label="Fechar"
          disabled={isPending}
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3"
            />
          }
        >
          <X aria-hidden />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
