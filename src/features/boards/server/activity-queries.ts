import "server-only";
import {
  ACTIVITY_PAGE_SIZE,
  parseCardActivity,
  type ActivityPage,
} from "@/features/boards/lib/card-activity";
import { db } from "@/server/db";

export async function getCardActivities(
  workspaceId: string,
  ref: { boardId: string; cardId: string },
  before: string | null,
): Promise<ActivityPage | null> {
  const card = await db.card.findUnique({
    where: {
      id: ref.cardId,
      column: { boardId: ref.boardId, board: { workspaceId } },
    },
    select: { id: true },
  });
  if (!card) {
    return null;
  }

  const rows = await db.cardActivity.findMany({
    where: {
      cardId: card.id,
      ...(before === null ? {} : { id: { lt: before } }),
    },
    orderBy: { id: "desc" },
    take: ACTIVITY_PAGE_SIZE + 1,
    select: { id: true, type: true, data: true, createdAt: true },
  });

  const page = rows.slice(0, ACTIVITY_PAGE_SIZE);
  const last = page.at(-1);
  return {
    activities: page.flatMap(({ id, type, data, createdAt }) => {
      const entry = parseCardActivity(type, data);
      return entry === null
        ? []
        : [{ ...entry, id, createdAt: createdAt.toISOString() }];
    }),
    nextCursor: rows.length > ACTIVITY_PAGE_SIZE && last ? last.id : null,
  };
}
