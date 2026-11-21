import { Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BoardsSection } from "@/components/boards/boards-section";
import { linkButton } from "@/components/button-styles";
import { MemberCount } from "@/components/member-count";
import { RoleBadge } from "@/components/role-badge";
import { WorkspaceTile } from "@/components/workspace-tile";
import { can } from "@/lib/permissions";
import { requireMembership } from "@/lib/workspaces";

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
              <span className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/w/${workspace.slug}/settings/members`}
                  className="rounded-sm font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 [&>span]:text-inherit"
                >
                  <MemberCount count={workspace.memberCount} />
                </Link>
                <RoleBadge role={workspace.role} />
              </span>
            </div>
          </div>
        </div>
        <Link
          href={
            can(workspace.role, "renameWorkspace")
              ? `/w/${workspace.slug}/settings`
              : `/w/${workspace.slug}/settings/members`
          }
          className={linkButton("outline", "h-11 w-full px-3 sm:h-9 sm:w-auto")}
        >
          <Settings aria-hidden />
          Configurações
        </Link>
      </div>
      <BoardsSection
        workspaceId={workspace.id}
        slug={workspace.slug}
        canManage={can(workspace.role, "manageBoards")}
      />
    </main>
  );
}
