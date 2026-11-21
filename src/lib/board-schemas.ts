import * as z from "zod";

export const BOARD_NAME_MAX_LENGTH = 60;
export const COLUMN_NAME_MAX_LENGTH = 40;

const boardName = z
  .string()
  .trim()
  .min(1, "Dê um nome ao quadro.")
  .max(
    BOARD_NAME_MAX_LENGTH,
    `Use no máximo ${BOARD_NAME_MAX_LENGTH} caracteres.`,
  );

const columnName = z
  .string()
  .trim()
  .min(1, "Dê um nome à coluna.")
  .max(
    COLUMN_NAME_MAX_LENGTH,
    `Use no máximo ${COLUMN_NAME_MAX_LENGTH} caracteres.`,
  );

export const boardNameSchema = z.object({ name: boardName });

export const columnNameSchema = z.object({ name: columnName });

export const moveColumnSchema = z
  .object({
    columnId: z.uuid(),
    previousColumnId: z.uuid().nullable(),
  })
  .refine(({ columnId, previousColumnId }) => columnId !== previousColumnId);
