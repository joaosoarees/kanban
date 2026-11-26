"use client";

import { toast } from "sonner";
import { PendingButton } from "@/components/pending-button";
import { TextField } from "@/components/text-field";
import { AccountCard } from "@/features/account/components/account-card";
import { changePasswordSchema } from "@/features/account/lib/schemas";
import { changePasswordAction } from "@/features/account/server/actions";
import { useActionForm } from "@/hooks/use-action-form";

const CHANGE_FAILED = "Não foi possível trocar a senha. Tente de novo.";

export function PasswordForm() {
  const {
    form: {
      register,
      reset,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: changePasswordSchema,
    defaultValues: { currentPassword: "", newPassword: "" },
    action: changePasswordAction,
    failure: CHANGE_FAILED,
    onSuccess: () => {
      reset();
      toast.success("Senha alterada", {
        description: "As outras sessões foram encerradas.",
      });
    },
  });

  return (
    <AccountCard
      id="account-password"
      title="Senha"
      description="Para trocar, confirme a senha atual."
    >
      <form
        onSubmit={submit}
        noValidate
        aria-busy={isPending}
        className="flex flex-col gap-4"
      >
        <fieldset
          disabled={isPending}
          className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0"
        >
          <TextField
            id="account-current-password"
            type="password"
            required
            label="Senha atual"
            autoComplete="current-password"
            error={errors.currentPassword?.message ?? errors.root?.message}
            {...register("currentPassword", { deps: ["newPassword"] })}
          />
          <TextField
            id="account-new-password"
            type="password"
            required
            label="Senha nova"
            autoComplete="new-password"
            hint="Use pelo menos 8 caracteres. As outras sessões serão encerradas."
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
        </fieldset>
        <div className="flex justify-end">
          <PendingButton
            type="submit"
            variant="outline"
            isPending={isPending}
            pendingLabel="Trocando a senha…"
            className="h-10 w-full px-4 enabled:hover:bg-muted sm:w-36"
          >
            Trocar senha
          </PendingButton>
        </div>
      </form>
    </AccountCard>
  );
}
