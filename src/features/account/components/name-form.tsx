"use client";

import { toast } from "sonner";
import { PendingButton } from "@/components/pending-button";
import { TextField } from "@/components/text-field";
import { AccountCard } from "@/features/account/components/account-card";
import { renameSchema } from "@/features/account/lib/schemas";
import { renameAction } from "@/features/account/server/actions";
import { useActionForm } from "@/hooks/use-action-form";

const RENAME_FAILED = "Não foi possível salvar o nome. Tente de novo.";

export function NameForm({ name }: { name: string }) {
  const {
    form: {
      register,
      reset,
      formState: { errors, isDirty },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: renameSchema,
    defaultValues: { name },
    action: renameAction,
    failure: RENAME_FAILED,
    onSuccess: (saved) => {
      reset(saved);
      toast.success("Nome atualizado");
    },
  });

  return (
    <AccountCard
      id="account-name"
      title="Nome"
      description="Aparece para as pessoas dos seus workspaces."
    >
      <form
        onSubmit={submit}
        noValidate
        aria-busy={isPending}
        className="flex flex-col gap-4"
      >
        <fieldset
          disabled={isPending}
          className="m-0 flex min-w-0 flex-col border-0 p-0"
        >
          <TextField
            id="account-name-input"
            required
            label="Nome"
            autoComplete="name"
            hint="Até 120 caracteres."
            error={errors.name?.message ?? errors.root?.message}
            {...register("name")}
          />
        </fieldset>
        <div className="flex justify-end">
          <PendingButton
            type="submit"
            variant="outline"
            isPending={isPending}
            pendingLabel="Salvando o nome…"
            disabled={!isDirty}
            className="h-10 w-full px-4 enabled:hover:bg-muted sm:w-36"
          >
            Salvar nome
          </PendingButton>
        </div>
      </form>
    </AccountCard>
  );
}
