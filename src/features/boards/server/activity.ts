import "server-only";
import type { CardActivityEvent } from "@/features/boards/lib/card-activity";
import type { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/server/session/current-user";

export async function recordActivity(
  tx: Prisma.TransactionClient,
  cardId: string,
  event: CardActivityEvent,
) {
  await recordActivities(tx, [cardId], event);
}

export async function recordActivities(
  tx: Prisma.TransactionClient,
  cardIds: string[],
  { type, ...data }: CardActivityEvent,
) {
  if (cardIds.length === 0) {
    return;
  }
  const actor = await requireUser();
  await tx.cardActivity.createMany({
    data: cardIds.map((cardId) => ({
      cardId,
      actorId: actor.id,
      type,
      data: { ...data, actorName: actor.name },
    })),
  });
}
