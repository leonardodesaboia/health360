import { Client } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness only: no records, credentials, or diagnostic error details. */
export async function GET() {
  let database: Client | undefined;
  try {
    if (!process.env.DATABASE_URL) throw new Error("Database not configured");
    database = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
      query_timeout: 3000,
    });
    await database.connect();
    await database.query("SELECT 1");
    return Response.json(
      { status: "ok" },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return Response.json(
      { status: "unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } finally {
    await database?.end().catch(() => undefined);
  }
}
