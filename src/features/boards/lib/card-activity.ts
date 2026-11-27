import * as z from "zod";
import { LabelColor } from "@/generated/prisma/enums";

const actorName = z.string();
const isoDate = z.iso.date().nullable();
const change = { actorName, from: z.string(), to: z.string() };
const labelSnapshot = {
  actorName,
  name: z.string(),
  color: z.enum(LabelColor),
};

export const cardActivitySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("CARD_CREATED"), actorName, column: z.string() }),
  z.object({ type: z.literal("CARD_MOVED"), ...change }),
  z.object({ type: z.literal("TITLE_CHANGED"), ...change }),
  z.object({ type: z.literal("DESCRIPTION_CHANGED"), actorName }),
  z.object({
    type: z.literal("DUE_CHANGED"),
    actorName,
    from: isoDate,
    to: isoDate,
  }),
  z.object({
    type: z.literal("COMPLETION_CHANGED"),
    actorName,
    completed: z.boolean(),
  }),
  z.object({
    type: z.literal("ASSIGNEE_CHANGED"),
    actorName,
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
  z.object({ type: z.literal("LABEL_ADDED"), ...labelSnapshot }),
  z.object({ type: z.literal("LABEL_REMOVED"), ...labelSnapshot }),
  z.object({
    type: z.literal("CHECKLIST_ITEM_COMPLETION_CHANGED"),
    actorName,
    text: z.string(),
    completed: z.boolean(),
  }),
]);

export type CardActivityEntry = z.infer<typeof cardActivitySchema>;

export type CardActivityEvent = CardActivityEntry extends infer Entry
  ? Entry extends CardActivityEntry
    ? Omit<Entry, "actorName">
    : never
  : never;

export function isoDateOf(date: Date | null) {
  return date === null ? null : date.toISOString().slice(0, 10);
}
