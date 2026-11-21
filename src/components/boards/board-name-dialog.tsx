"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { useState, useTransition, type TransitionStartFunction } from "react";
import { useForm } from "react-hook-form";
import type * as z from "zod";
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
import type { ActionResult } from "@/lib/action-result";
import { BOARD_NAME_MAX_LENGTH, boardNameSchema } from "@/lib/board-schemas";
import { applyActionErrors } from "@/lib/form-errors";
import { cn } from "@/lib/utils";

const SAVE_FAILED = "Não foi possível salvar o quadro. Tente de novo.";

type BoardNameInput = z.input<typeof boardNameSchema>;
type BoardNameOutput = z.output<typeof boardNameSchema>;

type BoardNameFormProps = {
  defaultName: string;
  submitLabel: string;
  pendingLabel: string;
  boardsHref: string;
  isPending: boolean;
  startTransition: TransitionStartFunction;
  submit: (values: BoardNameOutput) => Promise<ActionResult>;
  onDone: () => void;
};

type BoardNameDialogProps = Omit<
  BoardNameFormProps,
  "isPending" | "startTransition" | "onDone"
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
};

export function BoardNameDialog({
  open,
  onOpenChange,
  title,
  description,
  ...formProps
}: BoardNameDialogProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          onOpenChange(nextOpen);
        }
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
        <BoardNameForm
          {...formProps}
          isPending={isPending}
          startTransition={startTransition}
          onDone={() => {
            onOpenChange(false);
          }}
        />
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

function BoardNameForm({
  defaultName,
  submitLabel,
  pendingLabel,
  boardsHref,
  isPending,
  startTransition,
  submit,
  onDone,
}: BoardNameFormProps) {
  const [isGone, setIsGone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BoardNameInput, unknown, BoardNameOutput>({
    resolver: zodResolver(boardNameSchema),
    defaultValues: { name: defaultName },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        const result = await submit(values);
        if (result.status === "success") {
          onDone();
          return;
        }
        setIsGone(result.gone === true);
        applyActionErrors(result, setError);
      } catch (error) {
        unstable_rethrow(error);
        console.error(error);
        setError("root", { message: SAVE_FAILED });
      }
    });
  });

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
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
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
  );
}
