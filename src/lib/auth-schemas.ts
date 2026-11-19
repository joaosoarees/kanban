import * as z from "zod";

const PASSWORD_MAX_BYTES = 72;

const byteLength = (text: string) => new TextEncoder().encode(text).length;

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe seu nome")
    .max(120, "Use no máximo 120 caracteres"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("E-mail inválido").max(254, "E-mail longo demais")),
  password: z
    .string()
    .min(8, "Use pelo menos 8 caracteres")
    .refine((password) => byteLength(password) <= PASSWORD_MAX_BYTES, {
      error: "Senha longa demais",
    }),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Informe seu e-mail"),
  password: z.string().min(1, "Informe sua senha"),
});
