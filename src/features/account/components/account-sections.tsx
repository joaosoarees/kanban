import { EmailCard } from "@/features/account/components/email-card";
import { NameForm } from "@/features/account/components/name-form";
import { PasswordForm } from "@/features/account/components/password-form";
import { getEmailChange } from "@/features/account/server/queries";
import { requireUser } from "@/server/session";

export async function AccountSections() {
  const user = await requireUser();
  const change = await getEmailChange(user.id);

  return (
    <div className="flex flex-col gap-6">
      <NameForm name={user.name} />
      <PasswordForm />
      <EmailCard email={user.email} change={change} />
    </div>
  );
}
