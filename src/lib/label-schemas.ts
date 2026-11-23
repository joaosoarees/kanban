import * as z from "zod";
import { LabelColor } from "@/generated/prisma/enums";
import {
  hasNoLineBreak,
  hasNoNul,
  hasVisibleText,
  INVALID_CHARACTER,
} from "@/lib/text";

export const LABEL_NAME_MAX_LENGTH = 30;
export const MAX_LABELS_PER_BOARD = 50;
export const MAX_LABELS_PER_CARD = 8;

const labelName = z
  .string()
  .trim()
  .normalize("NFC")
  .max(
    LABEL_NAME_MAX_LENGTH,
    `Use no máximo ${LABEL_NAME_MAX_LENGTH} caracteres.`,
  )
  .refine(hasVisibleText, "Dê um nome à etiqueta.")
  .refine(hasNoLineBreak, "Use uma única linha.")
  .refine(hasNoNul, INVALID_CHARACTER);

export const labelSchema = z.object({
  name: labelName,
  color: z.enum(LabelColor),
});

export const cardAssigneeSchema = z.object({
  assigneeId: z.uuid().nullable(),
});
