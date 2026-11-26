import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { InviteScreen } from "@/features/members/components/invite-screen";

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
  const { token } = await params;
  return <InviteScreen token={token} />;
}
