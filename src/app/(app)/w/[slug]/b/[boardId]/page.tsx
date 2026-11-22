import type { Metadata } from "next";
import { BoardColumns } from "@/components/boards/board-columns";
import { BoardMenu } from "@/components/boards/board-menu";
import { requireBoard } from "@/lib/boards";
import { can } from "@/lib/permissions";
import { requireMembership } from "@/lib/workspaces";

export async function generateMetadata({
  params,
}: PageProps<"/w/[slug]/b/[boardId]">): Promise<Metadata> {
  const { slug, boardId } = await params;
  const workspace = await requireMembership(slug);
  const board = await requireBoard(workspace.id, boardId);
  return { title: board.name };
}

export default async function BoardPage({
  params,
}: PageProps<"/w/[slug]/b/[boardId]">) {
  const { slug, boardId } = await params;
  const workspace = await requireMembership(slug);
  const board = await requireBoard(workspace.id, boardId);
  const columns = board.columns.map(({ id, name, cards }) => ({
    id,
    name,
    cards,
  }));

  return (
    <main className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:h-16 sm:justify-start sm:px-6">
        <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl">
          {board.name}
        </h1>
        {can(workspace.role, "manageBoards") && (
          <BoardMenu
            workspaceId={workspace.id}
            boardId={board.id}
            name={board.name}
            columnCount={columns.length}
            boardsHref={`/w/${workspace.slug}`}
          />
        )}
      </div>
      <BoardColumns
        key={board.id}
        workspaceId={workspace.id}
        boardId={board.id}
        columns={columns}
      />
    </main>
  );
}
