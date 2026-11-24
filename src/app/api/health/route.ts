import { connection } from "next/server";
import { db } from "@/lib/db";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  await connection();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: NO_STORE });
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: NO_STORE },
    );
  }
}
