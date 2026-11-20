"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";
import { renameWorkspaceAction } from "@/app/(app)/w/[slug]/settings/actions";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { TextField } from "@/components/text-field";
import { applyActionErrors } from "@/lib/form-errors";
import { cn } from "@/lib/utils";
import {
  renameWorkspaceSchema,
  WORKSPACE_NAME_MAX_LENGTH,
} from "@/lib/workspace-schemas";

type RenameInput = z.input<typeof renameWorkspaceSchema>;
type RenameOutput = z.output<typeof renameWorkspaceSchema>;

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
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<RenameInput, unknown, RenameOutput>({
    resolver: zodResolver(renameWorkspaceSchema),
    defaultValues: { name },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await renameWorkspaceAction(workspaceId, values);
      if (result.status === "error") {
        applyActionErrors(result, setError);
        return;
      }
      reset({ name: values.name });
      toast.success("Nome do workspace atualizado.");
    });
  });

  return (
    <div className="rounded-xl border bg-white p-5">
      <form
        onSubmit={(event) => {
          void onSubmit(event);
        }}
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
