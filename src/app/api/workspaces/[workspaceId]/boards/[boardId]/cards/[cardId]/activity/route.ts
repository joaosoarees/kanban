import type { NextRequest } from "next/server";
import {
  activityPageSchema,
  type ActivityPage,
} from "@/features/boards/lib/card-activity";
import { CARD_GONE, parseCardRef } from "@/features/boards/server/access";
import { getCardActivities } from "@/features/boards/server/activity-queries";
import { loadActorFor } from "@/features/workspaces/server/access";
import {
  INVALID,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { getCurrentUser } from "@/server/session";

const NO_STORE = { "Cache-Control": "private, no-store" };

const SIGNED_OUT: ActionError = {
  status: "error",
  message: "Sua sessão terminou. Entre de novo para ver o histórico.",
};

function reply(body: ActionResult<ActivityPage>, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: RouteContext<"/api/workspaces/[workspaceId]/boards/[boardId]/cards/[cardId]/activity">,
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

  const query = activityPageSchema.safeParse({
    before: request.nextUrl.searchParams.get("before"),
  });
  if (!query.success) {
    return reply(INVALID, 400);
  }

  const page = await getCardActivities(
    actor.workspaceId,
    ref,
    query.data.before,
  );
  return page
    ? reply({ status: "success", data: page }, 200)
    : reply(CARD_GONE, 404);
}
