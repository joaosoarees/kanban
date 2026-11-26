const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export const INVITE_LIFETIME_MS = 7 * DAY_MS;
export const INVITE_RESEND_INTERVAL_MS = MINUTE_MS;
export const INVITE_SEND_WINDOW_MS = DAY_MS;
export const MAX_PENDING_INVITES = 50;
export const MAX_DAILY_INVITE_SENDS = 20;

export const INVITE_GONE_PARAM = { name: "invite", value: "gone" } as const;

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

const saoPauloDay = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const saoPauloDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function calendarDay(instant: Date): number {
  return Date.parse(`${saoPauloDay.format(instant)}T00:00:00Z`) / DAY_MS;
}

export function inviteDueLabel(expiresAt: Date, now: Date): string {
  if (isInviteExpired(expiresAt, now)) {
    return `Venceu em ${saoPauloDate.format(expiresAt)}`;
  }
  const days = calendarDay(expiresAt) - calendarDay(now);
  if (days === 0) {
    return "Vence hoje";
  }
  if (days === 1) {
    return "Vence amanhã";
  }
  return `Vence em ${days} dias`;
}
