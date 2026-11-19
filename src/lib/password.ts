import "server-only";
import { compare, hash, truncates } from "bcryptjs";

// Each step up doubles the time of one hash, for us and for an attacker.
const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return hash(password, COST);
}

// A hash no password was ever stored with, so an unknown e-mail costs one
// bcrypt comparison too and can't be told apart by timing.
let decoyHash: Promise<string> | undefined;

export async function verifyPassword(
  password: string,
  passwordHash: string | undefined,
): Promise<boolean> {
  decoyHash ??= hash(crypto.randomUUID(), COST);

  const matches = await compare(password, passwordHash ?? (await decoyHash));

  // bcrypt reads only 72 bytes; sign-up never stores a longer password.
  return matches && passwordHash !== undefined && !truncates(password);
}
