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

export const ACTIVITY_PAGE_SIZE = 30;

export const activityPageSchema = z.object({
  before: z.uuid().nullable(),
});

export type CardActivity = CardActivityEntry & {
  id: string;
  createdAt: string;
  byViewer: boolean;
};

export type ActivityPage = {
  activities: CardActivity[];
  nextCursor: string | null;
};

const activityData = z.record(z.string(), z.unknown());

export function parseCardActivity(type: string, data: unknown) {
  const fields = activityData.safeParse(data);
  if (!fields.success) {
    return null;
  }
  const entry = cardActivitySchema.safeParse({ ...fields.data, type });
  return entry.success ? entry.data : null;
}

export function mergeActivities(current: CardActivity[], page: CardActivity[]) {
  const byId = new Map(
    [...current, ...page].map((activity) => [activity.id, activity]),
  );
  return [...byId.values()].toSorted((a, b) => (a.id < b.id ? 1 : -1));
}
