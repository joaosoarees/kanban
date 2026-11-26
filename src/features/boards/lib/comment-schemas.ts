import * as z from "zod";
import { hasNoNul, hasVisibleText, INVALID_CHARACTER } from "@/lib/text";

export const COMMENT_MAX_LENGTH = 5000;
export const COMMENT_PAGE_SIZE = 30;

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .max(COMMENT_MAX_LENGTH, "Até 5.000 caracteres.")
    .refine(hasVisibleText, "Escreva o comentário.")
    .refine(hasNoNul, INVALID_CHARACTER),
});

export const commentPageSchema = z.object({
  before: z.uuid().nullable(),
});
