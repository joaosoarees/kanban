"use client";

import Link from "next/link";
import { useWatch } from "react-hook-form";
import { TextField } from "@/components/text-field";
import { FormFooter } from "@/features/auth/components/form-footer";
import { signInSchema } from "@/features/auth/lib/schemas";
import { signInAction } from "@/features/auth/server/actions";
import { useActionForm } from "@/hooks/use-action-form";

const SIGN_IN_FAILED = "Não foi possível entrar. Tente de novo.";

export function SignInForm() {
  const {
    form: {
      control,
      register,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: signInSchema,
    defaultValues: { email: "", password: "" },
    action: signInAction,
    failure: SIGN_IN_FAILED,
  });
  const email = useWatch({ control, name: "email" }).trim();

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
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          id="password"
          required
          label="Senha"
          labelAction={
            <Link
              href={
                email === ""
                  ? "/forgot-password"
                  : `/forgot-password?email=${encodeURIComponent(email)}`
              }
              className="rounded-sm text-[13px]/5 font-medium text-brand-fg underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Esqueci a senha
            </Link>
          }
          type="password"
          autoComplete="current-password"
          error={errors.password?.message ?? errors.root?.message}
          {...register("password")}
        />
      </fieldset>
      <FormFooter
        isPending={isPending}
        submitLabel="Entrar"
        pendingLabel="Entrando…"
        switchText="Não tem conta?"
        switchHref="/sign-up"
        switchLabel="Crie a sua"
      />
    </form>
  );
}
