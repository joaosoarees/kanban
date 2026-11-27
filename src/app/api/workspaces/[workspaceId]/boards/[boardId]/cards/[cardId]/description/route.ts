import { CARD_GONE } from "@/features/boards/server/access";
import { getCardDescription } from "@/features/boards/server/queries";
import { loadActorFor } from "@/features/workspaces/server/access";
import type { ActionError, ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/server/session";

const NO_STORE = { "Cache-Control": "private, no-store" };

const SIGNED_OUT: ActionError = {
  status: "error",
  message: "Sua sessão terminou. Entre de novo para abrir o card.",
};

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
  const user = await getCurrentUser();
  if (user === null) {
    return reply(SIGNED_OUT, 401);
  }

  const { workspaceId, boardId, cardId } = await params;
  const actor = await loadActorFor(user, workspaceId, "manageCards");
  if (!actor) {
    return reply(CARD_GONE, 404);
  }

  const card = await getCardDescription(actor.workspaceId, boardId, cardId);
  return card
    ? reply({ status: "success", data: card }, 200)
    : reply(CARD_GONE, 404);
}
