"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import * as z from "zod";
import { dangerOutlineButton } from "@/components/button-styles";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteWorkspaceAction } from "@/features/workspaces/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { cn } from "@/lib/utils";

const DELETE_FAILED = "Não foi possível excluir o workspace. Tente de novo.";
const NAME_MISMATCH = "Digite o nome do workspace exatamente como aparece.";

function confirmationSchema(workspaceName: string) {
  return z.object({
    confirmation: z
      .string()
      .refine((value) => value === workspaceName, NAME_MISMATCH),
  });
}

type DeleteWorkspaceProps = {
  workspaceId: string;
  workspaceName: string;
  memberCount: number;
};

export function DeleteWorkspace({
  workspaceId,
  workspaceName,
  memberCount,
}: DeleteWorkspaceProps) {
  const [open, setOpen] = useState(false);
  const {
    form: {
      register,
      control,
      reset,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: confirmationSchema(workspaceName),
    defaultValues: { confirmation: "" },
    action: async ({ confirmation }) =>
      deleteWorkspaceAction(workspaceId, confirmation),
    failure: DELETE_FAILED,
  });
  const confirmation = useWatch({ control, name: "confirmation" });

  const members =
    memberCount === 1
      ? "de 1 membro"
      : `de todos os ${memberCount}\u00A0membros`;

  return (
    <section
      aria-labelledby="delete-title"
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5"
    >
      <div className="flex max-w-[520px] flex-col gap-1">
        <h2 id="delete-title" className="text-[15px] font-semibold">
          Excluir workspace
        </h2>
        <p className="text-sm/relaxed text-pretty text-muted-foreground">
          Apaga o workspace, os quadros e os cards de todos os membros. Não dá
          para&nbsp;desfazer.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => {
          setOpen(true);
        }}
        className={cn("h-10 px-4", dangerOutlineButton)}
      >
        <Trash2 aria-hidden />
        Excluir workspace
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            reset();
          }
        }}
        title={`Excluir ${workspaceName}?`}
        description={`Apaga o workspace, os quadros e os cards ${members}. Não dá para\u00A0desfazer.`}
        confirmLabel="Excluir workspace"
        pendingLabel="Excluindo…"
        confirmDisabled={confirmation !== workspaceName}
        form={{
          submit,
          isPending,
          error: errors.confirmation?.message ?? errors.root?.message,
        }}
      >
        <div className="mt-4 flex flex-col gap-2">
          <Label htmlFor="delete-confirmation" className="block font-normal">
            Digite <strong className="font-semibold">{workspaceName}</strong>{" "}
            para confirmar
          </Label>
          <Input
            id="delete-confirmation"
            {...register("confirmation")}
            autoComplete="off"
            spellCheck={false}
            className="h-10"
          />
        </div>
      </ConfirmDialog>
    </section>
  );
}
