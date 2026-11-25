export const RESET_EXPIRED_MESSAGE =
  "Esta tela expirou. Peça a redefinição de novo.";

export function isResetGrantCurrent(
  issuedAt: Date,
  passwordChangedAt: Date | null,
): boolean {
  return (
    passwordChangedAt === null ||
    passwordChangedAt.getTime() < issuedAt.getTime()
  );
}
