"use client";

import { toast } from "sonner";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { TextField } from "@/components/text-field";
import {
  renameWorkspaceSchema,
  WORKSPACE_NAME_MAX_LENGTH,
} from "@/features/workspaces/lib/schemas";
import { renameWorkspaceAction } from "@/features/workspaces/server/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { cn } from "@/lib/utils";

const RENAME_FAILED = "Não foi possível renomear o workspace. Tente de novo.";

type RenameWorkspaceFormProps = {
  workspaceId: string;
  name: string;
  slug: string;
};

export function RenameWorkspaceForm({
  workspaceId,
  name,
  slug,
}: RenameWorkspaceFormProps) {
  const {
    form: {
      register,
      reset,
      formState: { errors, isDirty },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: renameWorkspaceSchema,
    defaultValues: { name },
    action: async (values) => renameWorkspaceAction(workspaceId, values),
    failure: RENAME_FAILED,
    onSuccess: (_, values) => {
      reset({ name: values.name });
      toast.success("Nome do workspace atualizado.");
    },
  });

  return (
    <div className="rounded-xl border bg-card p-5">
      <form
        onSubmit={submit}
        noValidate
        aria-busy={isPending}
        className="max-w-[480px]"
      >
        <fieldset
          disabled={isPending}
          className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
        >
          <TextField
            id="workspace-rename"
            required
            label="Nome do workspace"
            labelClassName="text-[15px] font-semibold"
            autoComplete="off"
            maxLength={WORKSPACE_NAME_MAX_LENGTH}
            hint={
              <>
                O endereço <span className="font-mono">/w/{slug}</span> não
                muda.
              </>
            }
            error={errors.name?.message ?? errors.root?.message}
            {...register("name")}
          />
          <div>
            <PendingButton
              type="submit"
              disabled={!isDirty}
              isPending={isPending}
              pendingLabel="Salvando…"
              className={cn("h-10 px-4", primaryButton)}
            >
              Salvar
            </PendingButton>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
