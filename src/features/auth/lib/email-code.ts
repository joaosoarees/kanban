import * as z from "zod";

const MINUTE_MS = 60 * 1000;

export const CODE_LENGTH = 8;
export const CODE_LIFETIME_MS = 15 * MINUTE_MS;
export const MAX_CODE_ATTEMPTS = 5;
export const RESEND_INTERVAL_MS = MINUTE_MS;

export const INVALID_CODE_MESSAGE = "Código inválido ou vencido. Peça um novo.";
export const MAIL_FAILED_MESSAGE =
  "Não conseguimos enviar o e-mail. Tente de novo em instantes.";
export const PENDING_EXPIRED_MESSAGE =
  "Esta tela expirou. Cadastre-se de novo.";

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .transform((code) => code.replaceAll(/\s/gu, ""))
    .pipe(
      z
        .string()
        .regex(
          new RegExp(`^\\d{${CODE_LENGTH}}$`, "u"),
          `Digite os ${CODE_LENGTH} números do código.`,
        ),
    ),
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
