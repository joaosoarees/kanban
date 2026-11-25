import type { Metadata } from "next";
import { Suspense } from "react";
import { BoardColumns } from "@/features/boards/components/board-columns";
import { BoardMenu } from "@/features/boards/components/board-menu";
import { BoardMetaProvider } from "@/features/boards/components/board-meta";
import { FilterMenu } from "@/features/boards/components/filter-menu";
import { requireBoard } from "@/features/boards/queries";
import { getAssignableMembers } from "@/features/members/queries";
import { requireMembership } from "@/features/workspaces/access";
import { can } from "@/features/workspaces/permissions";
import { requireUser } from "@/server/session";

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
  const user = await requireUser();
  const [board, members] = await Promise.all([
    requireBoard(workspace.id, boardId),
    getAssignableMembers(workspace.id, user.id),
  ]);
  const columns = board.columns.map(({ id, name, cards }) => ({
    id,
    name,
    cards,
  }));

  return (
    <main className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col lg:h-svh">
      <BoardMetaProvider labels={board.labels} members={members}>
        <div className="flex h-14 shrink-0 items-center gap-2 px-3 sm:h-16 sm:px-6">
          <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight max-sm:flex-1 sm:text-xl">
            {board.name}
          </h1>
          {can(workspace.role, "manageBoards") && (
            <div className="flex max-sm:order-2">
              <BoardMenu
                workspaceId={workspace.id}
                boardId={board.id}
                name={board.name}
                columnCount={columns.length}
                boardsHref={`/w/${workspace.slug}`}
              />
            </div>
          )}
          <Suspense fallback={null}>
            <FilterMenu />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <BoardColumns
            key={board.id}
            workspaceId={workspace.id}
            boardId={board.id}
            columns={columns}
          />
        </Suspense>
      </BoardMetaProvider>
    </main>
  );
}
