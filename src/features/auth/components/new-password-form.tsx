"use client";

import { TextField } from "@/components/text-field";
import { FormFooter } from "@/features/auth/components/form-footer";
import { newPasswordSchema } from "@/features/auth/lib/schemas";
import { resetPasswordAction } from "@/features/auth/server/actions";
import { useActionForm } from "@/hooks/use-action-form";

const SAVE_FAILED = "Não foi possível salvar. Tente de novo.";

export function NewPasswordForm({ onExpired }: { onExpired: () => void }) {
  const {
    form: {
      register,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: newPasswordSchema,
    defaultValues: { password: "" },
    action: resetPasswordAction,
    failure: SAVE_FAILED,
    onError: (error) => {
      if (error.gone === true) {
        onExpired();
      }
    },
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-busy={isPending}
      className="flex flex-col gap-5"
    >
      <fieldset
        disabled={isPending}
        className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0"
      >
        <TextField
          id="password"
          required
          label="Senha nova"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message ?? errors.root?.message}
          {...register("password")}
        />
      </fieldset>
      <FormFooter
        isPending={isPending}
        submitLabel="Salvar e entrar"
        pendingLabel="Salvando…"
        switchText="Lembrou a senha?"
        switchHref="/sign-in"
        switchLabel="Entrar"
      />
    </form>
  );
}
