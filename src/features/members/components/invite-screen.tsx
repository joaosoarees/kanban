import {
  InviteForGuest,
  InviteForMember,
  InviteForOtherAccount,
  InviteGone,
} from "@/features/members/components/invite-screens";
import { previewInvite } from "@/features/members/server/invite-acceptance";
import { getCurrentUser } from "@/server/session";

export async function InviteScreen({ token }: { token: string }) {
  const [user, invite] = await Promise.all([
    getCurrentUser(),
    previewInvite(token),
  ]);

  if (!invite) {
    return <InviteGone isSignedIn={user !== null} />;
  }
  if (!user) {
    return <InviteForGuest token={token} invite={invite} />;
  }
  if (user.email !== invite.email) {
    return (
      <InviteForOtherAccount token={token} invite={invite} email={user.email} />
    );
  }
  return <InviteForMember token={token} invite={invite} />;
}
