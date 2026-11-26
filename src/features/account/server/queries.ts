import "server-only";
import { connection } from "next/server";
import {
  loadEmailChange,
  type EmailChange,
} from "@/features/account/server/email-change";

export async function getEmailChange(
  userId: string,
): Promise<EmailChange | null> {
  await connection();
  return loadEmailChange(userId, new Date());
}
