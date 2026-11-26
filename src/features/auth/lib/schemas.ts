import * as z from "zod";
import { hasNoNul, hasVisibleText, INVALID_CHARACTER } from "@/lib/text";

const PASSWORD_MAX_BYTES = 72;

const byteLength = (text: string) => new TextEncoder().encode(text).length;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email("Digite um e-mail como nome@empresa.com.")
      .max(254, "E-mail longo demais."),
  );

const newPasswordField = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .refine((password) => byteLength(password) <= PASSWORD_MAX_BYTES, {
    error: "Senha longa demais.",
  });

export const userNameField = z
  .string()
  .trim()
  .max(120, "Use no máximo 120 caracteres.")
  .refine(hasVisibleText, "Digite seu nome.")
  .refine(hasNoNul, INVALID_CHARACTER);

export const signUpSchema = z.object({
  name: userNameField,
  email: emailField,
  password: newPasswordField,
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Digite seu e-mail.")
    .refine(hasNoNul, INVALID_CHARACTER),
  password: z.string().min(1, "Digite sua senha."),
});

export const resetRequestSchema = z.object({ email: emailField });

export const newPasswordSchema = z.object({ password: newPasswordField });
