"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { signInAction } from "@/app/(auth)/actions";
import { FormFooter } from "@/components/form-footer";
import { TextField } from "@/components/text-field";
import { signInSchema } from "@/lib/auth-schemas";
import { applyActionErrors } from "@/lib/form-errors";

type SignInInput = z.input<typeof signInSchema>;
type SignInOutput = z.output<typeof signInSchema>;

export function SignInForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInInput, unknown, SignInOutput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await signInAction(values);
      if (result.status === "error") {
        applyActionErrors(result, setError);
      }
    });
  });

  return (
    <form
      onSubmit={onSubmit}
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
