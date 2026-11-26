import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import {
  InviteForGuest,
  InviteForMember,
  InviteForOtherAccount,
  InviteGone,
} from "@/features/members/components/invite-screens";
import { previewInvite } from "@/features/members/server/invite-acceptance";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Convite" };

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <Invite params={params} />
      </Suspense>
    </AuthShell>
  );
}

async function Invite({
  params,
}: Pick<PageProps<"/invite/[token]">, "params">) {
  const [{ token }, user] = await Promise.all([params, getCurrentUser()]);
  const invite = await previewInvite(token);

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
