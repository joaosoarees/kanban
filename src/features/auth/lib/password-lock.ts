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

function sameGuard(a: PasswordGuard, b: PasswordGuard): boolean {
  return (
    a.failedPasswordAttempts === b.failedPasswordAttempts &&
    a.passwordLockedUntil?.getTime() === b.passwordLockedUntil?.getTime()
  );
}

export function afterPasswordMatch(
  current: PasswordGuard,
  reserved: PasswordGuard,
): PasswordGuard {
  if (sameGuard(current, reserved)) {
    return UNLOCKED_PASSWORD;
  }
  return {
    failedPasswordAttempts: Math.max(current.failedPasswordAttempts - 1, 0),
    passwordLockedUntil: current.passwordLockedUntil,
  };
}
