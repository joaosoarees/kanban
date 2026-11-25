import type { Metadata } from "next";
import { AddMemberForm } from "@/features/members/components/add-member-form";
import { LeaveWorkspace } from "@/features/members/components/leave-workspace";
import { MemberList } from "@/features/members/components/member-list";
import { getMembers } from "@/features/members/queries";
import { requireMembership } from "@/features/workspaces/access";
import { can } from "@/features/workspaces/permissions";
import { requireUser } from "@/server/session";

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
