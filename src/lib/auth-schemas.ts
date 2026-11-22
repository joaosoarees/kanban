import * as z from "zod";
import { hasNoNul, INVALID_CHARACTER } from "@/lib/text";

const PASSWORD_MAX_BYTES = 72;

export const EMAIL_TAKEN_MESSAGE = "Já existe uma conta com esse e-mail.";

const byteLength = (text: string) => new TextEncoder().encode(text).length;

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Digite seu nome.")
    .max(120, "Use no máximo 120 caracteres.")
    .refine(hasNoNul, INVALID_CHARACTER),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z
        .email("Digite um e-mail como nome@empresa.com.")
        .max(254, "E-mail longo demais."),
    ),
  password: z
    .string()
    .min(8, "Use pelo menos 8 caracteres.")
    .refine((password) => byteLength(password) <= PASSWORD_MAX_BYTES, {
      error: "Senha longa demais.",
    }),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Digite seu e-mail."),
  password: z.string().min(1, "Digite sua senha."),
});
