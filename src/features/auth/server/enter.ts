import "server-only";
import { redirect } from "next/navigation";
import { acceptInvite } from "@/features/members/server/invite-acceptance";
import { db } from "@/server/db";
import { forgetInvite, getRememberedInvite } from "@/server/session";

const AFTER_SIGN_IN = "/";

export async function enter(userId: string): Promise<never> {
  const invite = await getRememberedInvite();
  if (invite === null) {
    return redirect(AFTER_SIGN_IN);
  }

  await forgetInvite();
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true },
  });
  const outcome = await acceptInvite(user, invite, new Date());
  if (outcome.status === "accepted") {
    return redirect(`/w/${outcome.slug}`);
  }
  return redirect(`/invite/${invite}`);
}
