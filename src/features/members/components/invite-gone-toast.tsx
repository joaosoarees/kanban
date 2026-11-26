"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { INVITE_GONE_PARAM } from "@/features/members/lib/invites";

export function InviteGoneToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isGone = params.get(INVITE_GONE_PARAM.name) === INVITE_GONE_PARAM.value;

  useEffect(() => {
    if (!isGone) {
      return;
    }
    toast.warning("O convite não vale mais.", {
      id: "invite-gone",
      description: "Peça um novo a quem convidou.",
    });
    router.replace(pathname);
  }, [isGone, pathname, router]);

  return null;
}
