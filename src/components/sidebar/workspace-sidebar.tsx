import { SidebarShell } from "@/components/sidebar/sidebar-shell";
import { getBoards } from "@/lib/boards";
import { can } from "@/lib/permissions";
import { getMyWorkspaces, requireMembership } from "@/lib/workspaces";
import { requireUser } from "@/server/session";

async function loadBoards(workspaceId: string) {
  try {
    const boards = await getBoards(workspaceId);
    return boards
      .map(({ id, name }) => ({ id, name }))
      .toSorted(
        (a, b) =>
          a.name.localeCompare(b.name, "pt-BR") || a.id.localeCompare(b.id),
      );
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function WorkspaceSidebar({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workspace = await requireMembership(slug);
  const [user, workspaces, boards] = await Promise.all([
    requireUser(),
    getMyWorkspaces(),
    loadBoards(workspace.id),
  ]);

  return (
    <SidebarShell
      data={{
        user: { name: user.name, email: user.email },
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          canManageBoards: can(workspace.role, "manageBoards"),
          canConfigure: can(workspace.role, "renameWorkspace"),
        },
        workspaces: workspaces.map(({ id, name, slug: workspaceSlug }) => ({
          id,
          name,
          slug: workspaceSlug,
        })),
        boards,
      }}
    />
  );
}
