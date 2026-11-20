import { Settings, SquareKanban } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { linkButton } from "@/components/button-styles";
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
          href={`/w/${workspace.slug}/settings`}
          className={linkButton("outline", "h-9 w-full px-3 sm:w-auto")}
        >
          <Settings aria-hidden />
          Configurações
        </Link>
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
