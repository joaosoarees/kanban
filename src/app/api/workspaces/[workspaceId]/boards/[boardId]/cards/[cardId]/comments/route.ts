import type { NextRequest } from "next/server";
import { commentPageSchema } from "@/features/boards/lib/comment-schemas";
import { CARD_GONE, parseCardRef } from "@/features/boards/server/access";
import {
  getCardComments,
  type CommentPage,
} from "@/features/boards/server/comment-queries";
import { loadActorAllowedTo } from "@/features/workspaces/server/access";
import {
  INVALID,
  type ActionError,
  type ActionResult,
} from "@/lib/action-result";
import { getCurrentUser } from "@/server/session";

const NO_STORE = { "Cache-Control": "private, no-store" };

const SIGNED_OUT: ActionError = {
  status: "error",
  message: "Sua sessão terminou. Entre de novo para ver os comentários.",
};

function reply(body: ActionResult<CommentPage>, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: RouteContext<"/api/workspaces/[workspaceId]/boards/[boardId]/cards/[cardId]/comments">,
) {
  if ((await getCurrentUser()) === null) {
    return reply(SIGNED_OUT, 401);
  }

  const { workspaceId, boardId, cardId } = await params;
  const actor = await loadActorAllowedTo(workspaceId, "manageCards");
  const ref = parseCardRef(boardId, cardId);
  if (!actor || !ref) {
    return reply(CARD_GONE, 404);
  }

  const query = commentPageSchema.safeParse({
    before: request.nextUrl.searchParams.get("before"),
  });
  if (!query.success) {
    return reply(INVALID, 400);
  }

  const page = await getCardComments(actor, ref, query.data.before);
  return page
    ? reply({ status: "success", data: page }, 200)
    : reply(CARD_GONE, 404);
}
