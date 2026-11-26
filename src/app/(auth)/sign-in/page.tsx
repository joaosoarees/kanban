import type { Metadata } from "next";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { InviteNote } from "@/features/members/components/invite-note";
import { loadRememberedInvite } from "@/features/members/server/invite-acceptance";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage() {
  const invite = await loadRememberedInvite();

  return (
    <>
      {invite && <InviteNote invite={invite} />}
      <AuthHeading
        title="Entre na sua conta"
        description={
          invite
            ? "Depois de entrar, o convite é aceito e você vai para o workspace."
            : "Seus quadros estão esperando por você."
        }
      />
      <SignInForm key={invite?.email} invitedEmail={invite?.email} />
    </>
  );
}
