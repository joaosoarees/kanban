import { connection } from "next/server";

export async function GET() {
  await connection();
  const shuttingDown = process.env.SHUTTING_DOWN === "true";
  return new Response(null, {
    status: shuttingDown ? 503 : 204,
    headers: { "Cache-Control": "no-store" },
  });
}
