import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { InviteLoader } from "@/features/members/components/invite-loader";
import { InviteSkeleton } from "@/features/members/components/invite-skeleton";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Convite" };

export default function InvitePage() {
  return (
    <AuthShell>
      <Suspense fallback={<InviteSkeleton />}>
        <InviteForViewer />
      </Suspense>
    </AuthShell>
  );
}

async function InviteForViewer() {
  const user = await getCurrentUser();
  return <InviteLoader viewerEmail={user?.email ?? null} />;
}
