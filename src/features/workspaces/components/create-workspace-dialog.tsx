"use client";

import { X } from "lucide-react";
import { primaryButton } from "@/components/button-styles";
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
import { createWorkspaceAction } from "@/features/workspaces/actions";
import {
  createWorkspaceSchema,
  WORKSPACE_NAME_MAX_LENGTH,
} from "@/features/workspaces/schemas";
import { useActionForm } from "@/hooks/use-action-form";
import { cn } from "@/lib/utils";

const CREATE_FAILED = "Não foi possível criar o workspace. Tente de novo.";

type CreateWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const {
    form: {
      register,
      reset,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: createWorkspaceSchema,
    defaultValues: { name: "" },
    action: createWorkspaceAction,
    failure: CREATE_FAILED,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) {
      return;
    }
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 p-6 sm:max-w-[440px]"
      >
        <DialogHeader className="gap-1.5 pr-8">
          <DialogTitle className="text-lg font-semibold tracking-tight text-balance">
            Novo workspace
          </DialogTitle>
          <DialogDescription className="text-pretty">
            Dê um nome ao espaço onde seu time vai organizar os&nbsp;quadros.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={submit}
          noValidate
          aria-busy={isPending}
          className="mt-5"
        >
          <fieldset
            disabled={isPending}
            className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
          >
            <TextField
              id="workspace-name"
              required
              label="Nome"
              autoComplete="off"
              maxLength={WORKSPACE_NAME_MAX_LENGTH}
              hint={`Até ${WORKSPACE_NAME_MAX_LENGTH} caracteres.`}
              error={errors.name?.message ?? errors.root?.message}
              {...register("name")}
            />
            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <DialogClose
                render={<Button variant="outline" className="h-10 px-4" />}
              >
                Cancelar
              </DialogClose>
              <PendingButton
                type="submit"
                isPending={isPending}
                pendingLabel="Criando workspace…"
                className={cn("h-10 px-4", primaryButton)}
              >
                Criar workspace
              </PendingButton>
            </div>
          </fieldset>
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
