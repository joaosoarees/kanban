"use client";

import { TextField } from "@/components/text-field";
import { FormFooter } from "@/features/auth/components/form-footer";
import { resetRequestSchema } from "@/features/auth/lib/schemas";
import { requestPasswordResetAction } from "@/features/auth/server/actions";
import { useActionForm } from "@/hooks/use-action-form";

const REQUEST_FAILED = "Não foi possível enviar. Tente de novo.";

export function ForgotPasswordForm({ defaultEmail }: { defaultEmail: string }) {
  const {
    form: {
      register,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: resetRequestSchema,
    defaultValues: { email: defaultEmail },
    action: requestPasswordResetAction,
    failure: REQUEST_FAILED,
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
          id="email"
          required
          autoCapitalize="none"
          spellCheck={false}
          label="E-mail"
          type="email"
          autoComplete="email"
          error={errors.email?.message ?? errors.root?.message}
          {...register("email")}
        />
      </fieldset>
      <FormFooter
        isPending={isPending}
        submitLabel="Enviar código"
        pendingLabel="Enviando…"
        switchText="Lembrou a senha?"
        switchHref="/sign-in"
        switchLabel="Entrar"
      />
    </form>
  );
}
