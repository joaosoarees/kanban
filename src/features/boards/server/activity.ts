import "server-only";
import type { CardActivityEvent } from "@/features/boards/lib/card-activity";
import type { Prisma } from "@/generated/prisma/client";

export async function recordActivity(
  tx: Prisma.TransactionClient,
  actorId: string,
  cardId: string,
  event: CardActivityEvent,
) {
  await recordActivities(tx, actorId, [cardId], event);
}

export async function recordActivities(
  tx: Prisma.TransactionClient,
  actorId: string,
  cardIds: string[],
  { type, ...data }: CardActivityEvent,
) {
  if (cardIds.length === 0) {
    return;
  }
  const actor = await tx.user.findUniqueOrThrow({
    where: { id: actorId },
    select: { name: true },
  });
  await tx.cardActivity.createMany({
    data: cardIds.map((cardId) => ({
      cardId,
      actorId,
      type,
      data: { ...data, actorName: actor.name },
    })),
  });
}
