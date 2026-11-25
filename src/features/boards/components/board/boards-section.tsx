import { SquareKanban, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { BoardTile } from "@/features/boards/components/board/board-tile";
import { NewBoardButton } from "@/features/boards/components/board/new-board-button";
import { RetryButton } from "@/features/boards/components/board/retry-button";
import { getBoards } from "@/features/boards/server/queries";

type BoardsSectionProps = {
  workspaceId: string;
  slug: string;
  canManage: boolean;
};

async function loadBoards(workspaceId: string) {
  try {
    return await getBoards(workspaceId);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function BoardsSection({
  workspaceId,
  slug,
  canManage,
}: BoardsSectionProps) {
  const boards = await loadBoards(workspaceId);
  const boardsHref = `/w/${slug}`;

  return (
    <section aria-labelledby="boards-title" className="mt-7 sm:mt-10">
      <div className="mb-2 flex h-11 items-center justify-between sm:mb-3 sm:h-9">
        <h2
          id="boards-title"
          className="text-sm font-semibold text-fg-secondary"
        >
          Quadros
        </h2>
        {canManage && boards !== null && boards.length > 0 && (
          <NewBoardButton
            workspaceId={workspaceId}
            boardsHref={boardsHref}
            label="Novo quadro"
            className="h-11 sm:h-9"
          />
        )}
      </div>
      {boards === null && (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card px-6 py-14 text-center">
          <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-danger-bg">
            <TriangleAlert
              aria-hidden
              className="size-[22px] text-danger-text"
            />
          </span>
          <h3 className="text-base font-semibold">
            Não foi possível carregar os quadros
          </h3>
          <p className="text-sm text-muted-foreground">
            Confira sua conexão e tente de novo.
          </p>
          <div className="mt-4">
            <RetryButton />
          </div>
        </div>
      )}
      {boards?.length === 0 && (
        <EmptyState
          icon={SquareKanban}
          headingLevel="h3"
          title="Nenhum quadro ainda"
          description={
            canManage
              ? "Crie o primeiro quadro para organizar o trabalho do time em colunas."
              : "Quando um Dono ou Admin criar um quadro, ele vai aparecer aqui."
          }
          action={
            canManage ? (
              <NewBoardButton
                workspaceId={workspaceId}
                boardsHref={boardsHref}
                label="Criar quadro"
                className="h-10"
              />
            ) : undefined
          }
        />
      )}
      {boards !== null && boards.length > 0 && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-3 sm:gap-4">
          {boards.map((board) => (
            <li key={board.id} className="grid min-w-0">
              <BoardTile
                href={`${boardsHref}/b/${board.id}`}
                name={board.name}
                createdAt={board.createdAt}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
