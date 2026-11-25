export function isSessionCurrent(
  issuedAt: Date,
  passwordChangedAt: Date | null,
): boolean {
  if (passwordChangedAt === null) {
    return true;
  }
  const changedSecond = Math.floor(passwordChangedAt.getTime() / 1000);
  return issuedAt.getTime() / 1000 >= changedSecond;
}
