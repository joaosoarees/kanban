import * as z from "zod";

const MINUTE_MS = 60 * 1000;

export const CODE_LIFETIME_MS = 15 * MINUTE_MS;
export const MAX_CODE_ATTEMPTS = 5;
export const RESEND_INTERVAL_MS = MINUTE_MS;
export const ATTEMPT_WINDOW_MS = 60 * MINUTE_MS;
export const MAX_WINDOW_ATTEMPTS = 10;

export type AttemptWindow = {
  windowStartedAt: Date | null;
  windowAttempts: number;
};

export const INVALID_CODE_MESSAGE = "Código inválido ou vencido. Peça um novo.";

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .transform((code) => code.replaceAll(/\s/gu, ""))
    .pipe(z.string().regex(/^\d{6}$/u, "Digite os 6 números do código.")),
});

export function codeExpiresAt(sentAt: Date): Date {
  return new Date(sentAt.getTime() + CODE_LIFETIME_MS);
}

export function isCodeUsable(
  code: { expiresAt: Date; attempts: number },
  now: Date,
): boolean {
  return (
    now.getTime() < code.expiresAt.getTime() &&
    code.attempts < MAX_CODE_ATTEMPTS
  );
}

export function secondsUntilResend(sentAt: Date, now: Date): number {
  const remaining = sentAt.getTime() + RESEND_INTERVAL_MS - now.getTime();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

function isWindowOpen(window: AttemptWindow, now: Date): boolean {
  return (
    window.windowStartedAt !== null &&
    now.getTime() < window.windowStartedAt.getTime() + ATTEMPT_WINDOW_MS
  );
}

export function windowAfterWrongAttempt(
  current: AttemptWindow,
  now: Date,
): AttemptWindow {
  return isWindowOpen(current, now)
    ? {
        windowStartedAt: current.windowStartedAt,
        windowAttempts: current.windowAttempts + 1,
      }
    : { windowStartedAt: now, windowAttempts: 1 };
}

export function secondsUntilAttemptsReset(
  window: AttemptWindow,
  now: Date,
): number {
  if (
    window.windowStartedAt === null ||
    !isWindowOpen(window, now) ||
    window.windowAttempts < MAX_WINDOW_ATTEMPTS
  ) {
    return 0;
  }
  const remaining =
    window.windowStartedAt.getTime() + ATTEMPT_WINDOW_MS - now.getTime();
  return Math.ceil(remaining / 1000);
}
