import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeleteWorkspace } from "@/components/delete-workspace";
import { RenameWorkspaceForm } from "@/components/rename-workspace-form";
import { can } from "@/lib/permissions";
import { requireMembership } from "@/lib/workspaces";

export async function generateMetadata({
  params,
}: PageProps<"/w/[slug]/settings">): Promise<Metadata> {
  const { slug } = await params;
  const workspace = await requireMembership(slug);
  return { title: `Configurações · ${workspace.name}` };
}

export default async function GeneralSettingsPage({
  params,
}: PageProps<"/w/[slug]/settings">) {
  const { slug } = await params;
  const workspace = await requireMembership(slug);

  if (!can(workspace.role, "renameWorkspace")) {
    redirect(`/w/${workspace.slug}/settings/members`);
  }

  return (
    <>
      <RenameWorkspaceForm
        key={workspace.name}
        workspaceId={workspace.id}
        name={workspace.name}
        slug={workspace.slug}
      />
      {can(workspace.role, "deleteWorkspace") && (
        <DeleteWorkspace
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          memberCount={workspace.memberCount}
        />
      )}
    </>
  );
}
