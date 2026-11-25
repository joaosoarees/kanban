import * as z from "zod";
import { FORBIDDEN, type ActionResult } from "@/lib/action-result";
import { CARD_GONE } from "@/lib/boards";
import { loadActorAllowedTo } from "@/lib/workspaces";
import { db } from "@/server/db";

const NO_STORE = { "Cache-Control": "private, no-store" };

const cardRefSchema = z.object({
  boardId: z.uuid(),
  cardId: z.uuid(),
});

function reply(
  body: ActionResult<{ description: string | null }>,
  status: number,
) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<"/api/workspaces/[workspaceId]/boards/[boardId]/cards/[cardId]/description">,
) {
  const { workspaceId, ...ref } = await params;
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  if (!actor) {
    return reply(FORBIDDEN, 403);
  }

  const parsed = cardRefSchema.safeParse(ref);
  if (!parsed.success) {
    return reply(CARD_GONE, 404);
  }

  const card = await db.card.findFirst({
    where: {
      id: parsed.data.cardId,
      column: {
        boardId: parsed.data.boardId,
        board: { workspaceId: actor.workspaceId },
      },
    },
    select: { description: true },
  });
  return card
    ? reply({ status: "success", data: card }, 200)
    : reply(CARD_GONE, 404);
}
