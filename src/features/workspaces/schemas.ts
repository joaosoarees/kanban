import * as z from "zod";
import { hasNoNul, hasVisibleText, INVALID_CHARACTER } from "@/lib/text";

export const WORKSPACE_NAME_MAX_LENGTH = 60;

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .max(
      WORKSPACE_NAME_MAX_LENGTH,
      `Use no máximo ${WORKSPACE_NAME_MAX_LENGTH} caracteres.`,
    )
    .refine(hasVisibleText, "Dê um nome ao workspace.")
    .refine(hasNoNul, INVALID_CHARACTER),
});

export const renameWorkspaceSchema = createWorkspaceSchema;
