export const MAX_PASSWORD_FAILURES = 5;
export const PASSWORD_LOCK_MS = 15 * 60_000;

export type PasswordGuard = {
  failedPasswordAttempts: number;
  passwordLockedUntil: Date | null;
};

export function isPasswordLocked(guard: PasswordGuard, now: Date): boolean {
  return (
    guard.passwordLockedUntil !== null &&
    guard.passwordLockedUntil.getTime() > now.getTime()
  );
}

export function minutesUntilUnlock(guard: PasswordGuard, now: Date): number {
  const remaining = (guard.passwordLockedUntil?.getTime() ?? 0) - now.getTime();
  return Math.ceil(remaining / 60_000);
}

export function afterPasswordFailure(
  guard: PasswordGuard,
  now: Date,
): PasswordGuard {
  const failures = guard.failedPasswordAttempts + 1;
  if (failures >= MAX_PASSWORD_FAILURES) {
    return {
      failedPasswordAttempts: 0,
      passwordLockedUntil: new Date(now.getTime() + PASSWORD_LOCK_MS),
    };
  }
  return { failedPasswordAttempts: failures, passwordLockedUntil: null };
}

export const UNLOCKED_PASSWORD: PasswordGuard = {
  failedPasswordAttempts: 0,
  passwordLockedUntil: null,
};

function sameLock(a: Date | null, b: Date | null): boolean {
  return a?.getTime() === b?.getTime();
}

export function afterPasswordMatch(
  current: PasswordGuard,
  reserved: PasswordGuard,
): PasswordGuard {
  return sameLock(current.passwordLockedUntil, reserved.passwordLockedUntil)
    ? UNLOCKED_PASSWORD
    : {
        failedPasswordAttempts: current.failedPasswordAttempts,
        passwordLockedUntil: current.passwordLockedUntil,
      };
}
