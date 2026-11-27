import { LayoutGrid } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteGoneToast } from "@/features/members/components/invite-gone-toast";
import { MemberCount } from "@/features/workspaces/components/member-count";
import { NewWorkspaceButton } from "@/features/workspaces/components/new-workspace-button";
import { RoleBadge } from "@/features/workspaces/components/role-badge";
import { WorkspaceTile } from "@/features/workspaces/components/workspace-tile";
import {
  getMyWorkspaces,
  type WorkspaceSummary,
} from "@/features/workspaces/server/queries";

export const metadata: Metadata = { title: "Seus workspaces" };

export default function WorkspacesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
      <Suspense fallback={<WorkspacesSkeleton />}>
        <WorkspaceList />
      </Suspense>
      <Suspense fallback={null}>
        <InviteGoneToast />
      </Suspense>
    </main>
  );
}

function PageHeading({ hasWorkspaces }: { hasWorkspaces: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">
          Seus workspaces
        </h1>
        {hasWorkspaces && (
          <p className="text-sm text-muted-foreground">
            Escolha onde trabalhar ou crie um novo.
          </p>
        )}
      </div>
      {hasWorkspaces && <NewWorkspaceButton className="w-full sm:w-auto" />}
    </div>
  );
}

async function WorkspaceList() {
  const workspaces = await getMyWorkspaces();

  if (workspaces.length === 0) {
    return (
      <>
        <PageHeading hasWorkspaces={false} />
        <div className="mt-8">
          <EmptyState
            icon={LayoutGrid}
            title="Você ainda não tem workspaces"
            description="Um workspace reúne os quadros e as pessoas do seu time. Crie o primeiro para começar."
            action={<NewWorkspaceButton label="Criar workspace" />}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading hasWorkspaces />
      <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3 sm:mt-8 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:gap-4">
        {workspaces.map((workspace) => (
          <li key={workspace.id} className="min-w-0">
            <WorkspaceCard workspace={workspace} />
          </li>
        ))}
      </ul>
    </>
  );
}

function WorkspaceCard({ workspace }: { workspace: WorkspaceSummary }) {
  return (
    <Link
      href={`/w/${workspace.slug}`}
      className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow] outline-none hover:border-border-strong hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
    >
      <span className="flex min-w-0 items-center gap-3">
        <WorkspaceTile
          name={workspace.name}
          slug={workspace.slug}
          className="size-10 rounded-lg text-base"
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold">
            {workspace.name}
          </span>
          <span className="truncate font-mono text-[13px]/5 text-muted-foreground">
            /w/{workspace.slug}
          </span>
        </span>
      </span>
      <span className="flex items-center justify-between gap-2">
        <MemberCount count={workspace.memberCount} />
        <RoleBadge role={workspace.role} />
      </span>
    </Link>
  );
}

function WorkspacesSkeleton() {
  return (
    <output className="block">
      <span className="sr-only">Carregando seus workspaces…</span>
      <div aria-hidden>
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-[26px] w-60 bg-muted-strong" />
            <Skeleton className="h-3.5 w-72 bg-muted-strong" />
          </div>
          <Skeleton className="hidden h-10 w-40 rounded-lg bg-muted-strong sm:block" />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex flex-col gap-5 rounded-xl border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg bg-muted-strong" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-3/5 bg-muted-strong" />
                  <Skeleton className="h-3 w-2/5 bg-muted-strong" />
                </div>
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-24 bg-muted-strong" />
                <Skeleton className="h-[22px] w-14 rounded-full bg-muted-strong" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </output>
  );
}
