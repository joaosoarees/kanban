import { CARD_GONE, parseCardRef } from "@/features/boards/server/access";
import {
  getCardChecklist,
  type ChecklistItem,
} from "@/features/boards/server/checklist-queries";
import { loadActorFor } from "@/features/workspaces/server/access";
import type { ActionError, ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/server/session";

const NO_STORE = { "Cache-Control": "private, no-store" };

const SIGNED_OUT: ActionError = {
  status: "error",
  message: "Sua sessão terminou. Entre de novo para ver o checklist.",
};

function reply(body: ActionResult<ChecklistItem[]>, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<"/api/workspaces/[workspaceId]/boards/[boardId]/cards/[cardId]/checklist">,
) {
  const user = await getCurrentUser();
  if (user === null) {
    return reply(SIGNED_OUT, 401);
  }

  const { workspaceId, boardId, cardId } = await params;
  const actor = await loadActorFor(user, workspaceId, "manageCards");
  const ref = parseCardRef(boardId, cardId);
  if (!actor || !ref) {
    return reply(CARD_GONE, 404);
  }

  const items = await getCardChecklist(actor.workspaceId, ref);
  return items
    ? reply({ status: "success", data: items }, 200)
    : reply(CARD_GONE, 404);
}
