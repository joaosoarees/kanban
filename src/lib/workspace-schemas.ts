import * as z from "zod";

export const WORKSPACE_NAME_MAX_LENGTH = 60;

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dê um nome ao workspace.")
    .max(
      WORKSPACE_NAME_MAX_LENGTH,
      `Use no máximo ${WORKSPACE_NAME_MAX_LENGTH} caracteres.`,
    ),
});
