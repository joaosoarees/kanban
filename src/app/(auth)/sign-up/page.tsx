import type { Metadata } from "next";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { InviteNote } from "@/features/members/components/invite-note";
import { loadRememberedInvite } from "@/features/members/server/invite-acceptance";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignUpPage() {
  const invite = await loadRememberedInvite();

  return (
    <>
      {invite && <InviteNote invite={invite} />}
      <AuthHeading
        title="Crie sua conta"
        description={
          invite
            ? "Depois de confirmar o e-mail, você entra direto no workspace."
            : "Organize o trabalho do seu time em quadros."
        }
      />
      <SignUpForm key={invite?.email} invitedEmail={invite?.email} />
    </>
  );
}
