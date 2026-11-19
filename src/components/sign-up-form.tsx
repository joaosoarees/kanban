"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { signUpAction } from "@/app/(auth)/actions";
import { FormFooter } from "@/components/form-footer";
import { TextField } from "@/components/text-field";
import { signUpSchema } from "@/lib/auth-schemas";
import { applyActionErrors } from "@/lib/form-errors";

type SignUpInput = z.input<typeof signUpSchema>;
type SignUpOutput = z.output<typeof signUpSchema>;

export function SignUpForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpInput, unknown, SignUpOutput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await signUpAction(values);
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
          error={errors.password?.message}
          {...register("password")}
        />
      </fieldset>
      <FormFooter
        error={errors.root?.message}
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
