import "server-only";
import type { CardActivityEvent } from "@/features/boards/lib/card-activity";
import type { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/server/session/current-user";

export async function recordActivity(
  tx: Prisma.TransactionClient,
  cardId: string,
  { type, ...data }: CardActivityEvent,
) {
  const actor = await requireUser();
  await tx.cardActivity.create({
    data: {
      cardId,
      actorId: actor.id,
      type,
      data: { ...data, actorName: actor.name },
    },
    select: { id: true },
  });
}
