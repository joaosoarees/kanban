import { connection } from "next/server";
import { db } from "@/server/db";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  await connection();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: NO_STORE });
  } catch (error) {
    console.error("health check failed", error);
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: NO_STORE },
    );
  }
}
