"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  InviteForGuest,
  InviteForMember,
  InviteForOtherAccount,
  InviteGone,
  InviteLoadFailed,
} from "@/features/members/components/invite-screens";
import { InviteSkeleton } from "@/features/members/components/invite-skeleton";
import { inviteTokenSchema } from "@/features/members/lib/schemas";
import type { InvitePreview } from "@/features/members/server/invite-acceptance";
import { previewInviteAction } from "@/features/members/server/invite-actions";

const SLOW_AFTER_MS = 2000;

type Outcome =
  { status: "loaded"; invite: InvitePreview | null } | { status: "failed" };

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
  };
}

function readHash() {
  return window.location.hash.slice(1);
}

function noHashOnServer() {
  return null;
}

export function InviteLoader({ viewerEmail }: { viewerEmail: string | null }) {
  const hash = useSyncExternalStore(subscribeToHash, readHash, noHashOnServer);
  const [attempt, setAttempt] = useState(0);
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    const settleTimer = setTimeout(() => {
      setIsSettled(true);
    }, 0);
    return () => {
      clearTimeout(settleTimer);
    };
  }, []);

  if (hash === null || (hash === "" && !isSettled)) {
    return <InviteSkeleton />;
  }
  if (!inviteTokenSchema.safeParse(hash).success) {
    return <InviteGone isSignedIn={viewerEmail !== null} />;
  }
  return (
    <InviteFetch
      key={`${attempt}:${hash}`}
      token={hash}
      viewerEmail={viewerEmail}
      reload={() => {
        setAttempt((current) => current + 1);
      }}
    />
  );
}

function InviteFetch({
  token,
  viewerEmail,
  reload,
}: {
  token: string;
  viewerEmail: string | null;
  reload: () => void;
}) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    let active = true;
    const slowTimer = setTimeout(() => {
      setIsSlow(true);
    }, SLOW_AFTER_MS);

    async function load() {
      let next: Outcome;
      try {
        next = { status: "loaded", invite: await previewInviteAction(token) };
      } catch {
        next = { status: "failed" };
      }
      clearTimeout(slowTimer);
      if (active) {
        setOutcome(next);
      }
    }

    void load();
    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [token]);

  if (outcome === null) {
    return <InviteSkeleton slow={isSlow} />;
  }
  if (outcome.status === "failed") {
    return <InviteLoadFailed onRetry={reload} />;
  }

  const { invite } = outcome;
  if (!invite) {
    return <InviteGone isSignedIn={viewerEmail !== null} />;
  }
  if (viewerEmail === null) {
    return <InviteForGuest token={token} invite={invite} onGone={reload} />;
  }
  if (viewerEmail !== invite.email) {
    return (
      <InviteForOtherAccount
        token={token}
        invite={invite}
        email={viewerEmail}
        onGone={reload}
      />
    );
  }
  return <InviteForMember token={token} invite={invite} onGone={reload} />;
}
