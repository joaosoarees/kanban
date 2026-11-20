import { SquareKanban } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { MemberCount } from "@/components/member-count";
import { RoleBadge } from "@/components/role-badge";
import { WorkspaceTile } from "@/components/workspace-tile";
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
      <div className="flex items-center gap-4">
        <WorkspaceTile
          name={workspace.name}
          slug={workspace.slug}
          className="size-10 rounded-[10px] text-[17px] sm:size-12 sm:text-xl"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-[22px] font-semibold tracking-tight sm:text-[26px]">
            {workspace.name}
          </h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground">
            <span className="font-mono">/w/{workspace.slug}</span>
            <span aria-hidden>·</span>
            <MemberCount count={workspace.memberCount} />
            <span aria-hidden>·</span>
            <RoleBadge role={workspace.role} />
          </p>
        </div>
      </div>
      <section aria-labelledby="boards-title" className="mt-10">
        <h2
          id="boards-title"
          className="mb-3 text-sm font-semibold text-zinc-700"
        >
          Quadros
        </h2>
        <EmptyState
          icon={SquareKanban}
          headingLevel="h3"
          title="Nenhum quadro ainda"
          description="Os quadros deste workspace vão aparecer aqui."
        />
      </section>
    </main>
  );
}
