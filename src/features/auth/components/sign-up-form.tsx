"use client";

import { TextField } from "@/components/text-field";
import { FormFooter } from "@/features/auth/components/form-footer";
import { signUpSchema } from "@/features/auth/lib/schemas";
import { signUpAction } from "@/features/auth/server/actions";
import { useActionForm } from "@/hooks/use-action-form";

const SIGN_UP_FAILED = "Não foi possível criar a conta. Tente de novo.";

export function SignUpForm() {
  const {
    form: {
      register,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: signUpSchema,
    defaultValues: { name: "", email: "", password: "" },
    action: signUpAction,
    failure: SIGN_UP_FAILED,
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
          id="name"
          required
          label="Nome"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <TextField
          id="email"
          required
          autoCapitalize="none"
          spellCheck={false}
          label="E-mail"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          id="password"
          required
          label="Senha"
          type="password"
          autoComplete="new-password"
          hint="Use pelo menos 8 caracteres."
          error={errors.password?.message ?? errors.root?.message}
          {...register("password")}
        />
      </fieldset>
      <FormFooter
        isPending={isPending}
        submitLabel="Criar conta"
        pendingLabel="Criando conta…"
        switchText="Já tem conta?"
        switchHref="/sign-in"
        switchLabel="Entre"
      />
    </form>
  );
}
