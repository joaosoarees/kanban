import * as z from "zod";
import { hasNoNul, hasVisibleText, INVALID_CHARACTER } from "@/lib/text";

export const CARD_TITLE_MAX_LENGTH = 200;
export const CARD_DESCRIPTION_MAX_LENGTH = 5000;

const LINE_BREAK = /[\n\v\f\r\u0085\u2028\u2029]/u;

const cardTitle = z
  .string()
  .trim()
  .max(
    CARD_TITLE_MAX_LENGTH,
    `Use no máximo ${CARD_TITLE_MAX_LENGTH} caracteres.`,
  )
  .refine(hasVisibleText, "Dê um título ao card.")
  .refine((title) => !LINE_BREAK.test(title), "Use uma única linha.")
  .refine(hasNoNul, INVALID_CHARACTER);

const cardDescription = z
  .string()
  .trim()
  .max(
    CARD_DESCRIPTION_MAX_LENGTH,
    `Use no máximo ${CARD_DESCRIPTION_MAX_LENGTH} caracteres.`,
  )
  .refine(hasNoNul, INVALID_CHARACTER)
  .transform((description) =>
    hasVisibleText(description) ? description : null,
  );

export const createCardSchema = z.object({
  columnId: z.uuid(),
  title: cardTitle,
});

export const cardTitleSchema = z.object({ title: cardTitle });

export const cardDescriptionSchema = z.object({
  description: cardDescription,
});

export const moveCardSchema = z
  .object({
    cardId: z.uuid(),
    columnId: z.uuid(),
    previousCardId: z.uuid().nullable(),
  })
  .refine(({ cardId, previousCardId }) => cardId !== previousCardId);
