import * as z from "zod";
import { hasNoNul, hasVisibleText, INVALID_CHARACTER } from "@/lib/text";

export const BOARD_NAME_MAX_LENGTH = 60;
export const COLUMN_NAME_MAX_LENGTH = 40;

const boardName = z
  .string()
  .trim()
  .max(
    BOARD_NAME_MAX_LENGTH,
    `Use no máximo ${BOARD_NAME_MAX_LENGTH} caracteres.`,
  )
  .refine(hasVisibleText, "Dê um nome ao quadro.")
  .refine(hasNoNul, INVALID_CHARACTER);

const columnName = z
  .string()
  .trim()
  .max(
    COLUMN_NAME_MAX_LENGTH,
    `Use no máximo ${COLUMN_NAME_MAX_LENGTH} caracteres.`,
  )
  .refine(hasVisibleText, "Dê um nome à coluna.")
  .refine(hasNoNul, INVALID_CHARACTER);

export const boardNameSchema = z.object({ name: boardName });

export const columnNameSchema = z.object({ name: columnName });

export const moveColumnSchema = z
  .object({
    columnId: z.uuid(),
    previousColumnId: z.uuid().nullable(),
  })
  .refine(({ columnId, previousColumnId }) => columnId !== previousColumnId);
