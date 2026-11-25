import type { Metadata } from "next";
import { AddMemberForm } from "@/components/add-member-form";
import { LeaveWorkspace } from "@/components/leave-workspace";
import { MemberList } from "@/components/member-list";
import { requireUser } from "@/server/session";
import { can } from "@/lib/permissions";
import { getMembers, requireMembership } from "@/lib/workspaces";

export async function generateMetadata({
  params,
}: PageProps<"/w/[slug]/settings/members">): Promise<Metadata> {
  const { slug } = await params;
  const workspace = await requireMembership(slug);
  return { title: `Membros · ${workspace.name}` };
}

export default async function MembersPage({
  params,
}: PageProps<"/w/[slug]/settings/members">) {
  const { slug } = await params;
  const [user, workspace] = await Promise.all([
    requireUser(),
    requireMembership(slug),
  ]);
  const members = await getMembers(workspace.id);

  return (
    <>
      {can(workspace.role, "addMember") && (
        <AddMemberForm workspaceId={workspace.id} />
      )}
      <MemberList
        workspaceId={workspace.id}
        members={members}
        viewer={{ userId: user.id, role: workspace.role }}
      />
      {can(workspace.role, "leaveWorkspace") && (
        <LeaveWorkspace
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          assignedCards={
            members.find(({ userId }) => userId === user.id)?.assignedCards ?? 0
          }
        />
      )}
    </>
  );
}
