import type { Metadata } from "next";
import { BoardsSection } from "@/features/boards/components/board/boards-section";
import { RoleBadge } from "@/features/workspaces/components/role-badge";
import { WorkspaceTile } from "@/features/workspaces/components/workspace-tile";
import { can } from "@/features/workspaces/lib/permissions";
import { requireMembership } from "@/features/workspaces/server/access";

export async function generateMetadata({
  params,
}: PageProps<"/w/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const workspace = await requireMembership(slug);
  return { title: workspace.name };
}

export default async function WorkspacePage({
  params,
}: PageProps<"/w/[slug]">) {
  const { slug } = await params;
  const workspace = await requireMembership(slug);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <WorkspaceTile
            name={workspace.name}
            slug={workspace.slug}
            className="size-10 rounded-[10px] text-[17px] sm:size-12 sm:text-xl"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-[22px] font-semibold tracking-tight sm:text-[26px]">
              {workspace.name}
            </h1>
            <div className="flex min-w-0 flex-col gap-1.5 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
              <span className="truncate font-mono">/w/{workspace.slug}</span>
              <span className="flex shrink-0">
                <RoleBadge role={workspace.role} />
              </span>
            </div>
          </div>
        </div>
      </div>
      <BoardsSection
        workspaceId={workspace.id}
        slug={workspace.slug}
        canManage={can(workspace.role, "manageBoards")}
      />
    </main>
  );
}
