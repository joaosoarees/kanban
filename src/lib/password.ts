import "server-only";
import { compare, hash, truncates } from "bcryptjs";

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return hash(password, COST);
}

let decoyHash: Promise<string> | undefined;

export async function verifyPassword(
  password: string,
  passwordHash: string | undefined,
): Promise<boolean> {
  decoyHash ??= hash(crypto.randomUUID(), COST);

  const matches = await compare(password, passwordHash ?? (await decoyHash));

  return matches && passwordHash !== undefined && !truncates(password);
}
