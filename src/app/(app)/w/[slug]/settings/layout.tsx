import { SettingsTabs } from "@/components/settings-tabs";
import { WorkspaceTile } from "@/components/workspace-tile";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { requireMembership } from "@/lib/workspaces";

export default async function SettingsLayout({
  children,
  params,
}: LayoutProps<"/w/[slug]/settings">) {
  const { slug } = await params;
  const workspace = await requireMembership(slug);
  const showGeneral = can(workspace.role, "renameWorkspace");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center gap-3">
        <WorkspaceTile
          name={workspace.name}
          slug={workspace.slug}
          className="size-9 rounded-lg text-[15px]"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-[13px] text-muted-foreground">
            {workspace.name}
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">
            Configurações
          </h1>
        </div>
      </div>
      <SettingsTabs
        slug={workspace.slug}
        memberCount={workspace.memberCount}
        showGeneral={showGeneral}
      />
      <div className={cn("flex flex-col gap-6", showGeneral ? "mt-6" : "mt-3")}>
        {children}
      </div>
    </main>
  );
}
