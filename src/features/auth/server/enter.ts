import "server-only";
import { redirect } from "next/navigation";
import { INVITE_GONE_PARAM } from "@/features/members/lib/invites";
import { acceptInvite } from "@/features/members/server/invite-acceptance";
import { db } from "@/server/db";
import { forgetInvite, getRememberedInvite } from "@/server/session";

const AFTER_SIGN_IN = "/";

export async function enter(userId: string): Promise<never> {
  const invite = await getRememberedInvite();
  if (invite === null) {
    return redirect(AFTER_SIGN_IN);
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true },
  });
  const outcome = await acceptInvite(user, invite, new Date());
  await forgetInvite();
  if (outcome.status === "accepted") {
    return redirect(`/w/${outcome.slug}`);
  }
  if (outcome.status === "other-email") {
    return redirect(`/invite#${invite}`);
  }
  return redirect(
    `${AFTER_SIGN_IN}?${INVITE_GONE_PARAM.name}=${INVITE_GONE_PARAM.value}`,
  );
}
