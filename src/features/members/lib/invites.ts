const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export const INVITE_LIFETIME_MS = 7 * DAY_MS;
export const INVITE_RESEND_INTERVAL_MS = MINUTE_MS;
export const INVITE_SEND_WINDOW_MS = DAY_MS;
export const MAX_PENDING_INVITES = 50;
export const MAX_DAILY_INVITE_SENDS = 20;

export const INVITE_GONE_MESSAGE =
  "Este convite não vale mais. Peça um novo a quem convidou.";

export function inviteExpiresAt(sentAt: Date): Date {
  return new Date(sentAt.getTime() + INVITE_LIFETIME_MS);
}

export function isInviteExpired(expiresAt: Date, now: Date): boolean {
  return now.getTime() >= expiresAt.getTime();
}

export function sendWindowStart(now: Date): Date {
  return new Date(now.getTime() - INVITE_SEND_WINDOW_MS);
}

export function secondsUntilInviteResend(sentAt: Date, now: Date): number {
  const remaining =
    sentAt.getTime() + INVITE_RESEND_INTERVAL_MS - now.getTime();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}
