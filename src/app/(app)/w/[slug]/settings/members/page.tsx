import type { Metadata } from "next";
import { InviteForm } from "@/features/members/components/invite-form";
import { LeaveWorkspace } from "@/features/members/components/leave-workspace";
import { MemberList } from "@/features/members/components/member-list";
import { PendingInvites } from "@/features/members/components/pending-invites";
import {
  getMembers,
  getPendingInvites,
} from "@/features/members/server/queries";
import { can } from "@/features/workspaces/lib/permissions";
import { requireMembership } from "@/features/workspaces/server/access";
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
  const canInvite = can(workspace.role, "inviteMember");
  const [members, invites] = await Promise.all([
    getMembers(workspace.id),
    canInvite ? getPendingInvites(workspace.id) : [],
  ]);

  return (
    <>
      {canInvite && (
        <>
          <InviteForm workspaceId={workspace.id} />
          <PendingInvites
            workspaceId={workspace.id}
            invites={invites}
            viewerId={user.id}
          />
        </>
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
