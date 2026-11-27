import * as z from "zod";
import {
  emailField,
  newPasswordField,
  userNameField,
} from "@/features/auth/lib/schemas";

export const renameSchema = z.object({ name: userNameField });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Digite sua senha atual."),
    newPassword: newPasswordField,
  })
  .refine((input) => input.newPassword !== input.currentPassword, {
    path: ["newPassword"],
    error: "A senha nova precisa ser diferente da atual.",
  });

export const emailChangeSchema = z.object({
  newEmail: emailField,
  password: z.string().min(1, "Digite sua senha atual."),
});
