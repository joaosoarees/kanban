import "server-only";
import { randomBytes } from "node:crypto";
import { compare, hash, truncates } from "bcryptjs";

const COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, COST);
}

const decoyHash = hash(randomBytes(32).toString("hex"), COST);

export async function verifyPassword(
  password: string,
  passwordHash?: string,
): Promise<boolean> {
  const matches = await compare(password, passwordHash ?? (await decoyHash));

  return matches && passwordHash !== undefined && !truncates(password);
}
