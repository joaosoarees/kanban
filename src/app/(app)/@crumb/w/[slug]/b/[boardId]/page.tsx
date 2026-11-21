import { BoardCrumb } from "@/components/boards/board-crumb";
import { requireBoard } from "@/lib/boards";
import { requireMembership } from "@/lib/workspaces";

export default async function BoardCrumbSlot({
  params,
}: PageProps<"/w/[slug]/b/[boardId]">) {
  const { slug, boardId } = await params;
  const workspace = await requireMembership(slug);
  const board = await requireBoard(workspace.id, boardId);

  return (
    <BoardCrumb href={`/w/${workspace.slug}/b/${board.id}`} name={board.name} />
  );
}
