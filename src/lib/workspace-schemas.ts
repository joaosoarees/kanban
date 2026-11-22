import * as z from "zod";
import { hasNoNul, INVALID_CHARACTER } from "@/lib/text";

export const WORKSPACE_NAME_MAX_LENGTH = 60;

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dê um nome ao workspace.")
    .max(
      WORKSPACE_NAME_MAX_LENGTH,
      `Use no máximo ${WORKSPACE_NAME_MAX_LENGTH} caracteres.`,
    )
    .refine(hasNoNul, INVALID_CHARACTER),
});

export const renameWorkspaceSchema = createWorkspaceSchema;

export const assignableRoleSchema = z.enum(["ADMIN", "MEMBER"]);

export const addMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Digite um e-mail como nome@empresa.com.")),
  role: assignableRoleSchema,
});

export const changeRoleSchema = z.object({
  userId: z.uuid(),
  role: assignableRoleSchema,
});

export const removeMemberSchema = z.object({
  userId: z.uuid(),
});
