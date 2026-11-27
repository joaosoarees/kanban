import * as z from "zod";
import {
  hasNoLineBreak,
  hasNoNul,
  hasVisibleText,
  INVALID_CHARACTER,
} from "@/lib/text";

export const CHECKLIST_ITEM_MAX_LENGTH = 200;
export const MAX_CHECKLIST_ITEMS = 50;

export const checklistItemSchema = z.object({
  text: z
    .string()
    .trim()
    .max(
      CHECKLIST_ITEM_MAX_LENGTH,
      `Use no máximo ${CHECKLIST_ITEM_MAX_LENGTH} caracteres.`,
    )
    .refine(hasVisibleText, "Escreva o item.")
    .refine(hasNoLineBreak, "Use uma única linha.")
    .refine(hasNoNul, INVALID_CHARACTER),
});

export const checklistItemCompletionSchema = z.object({
  completed: z.boolean(),
});

export const moveChecklistItemSchema = z
  .object({
    itemId: z.uuid(),
    previousItemId: z.uuid().nullable(),
  })
  .refine(({ itemId, previousItemId }) => itemId !== previousItemId);
