import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

export function createDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL is required");
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 3 }),
    log: [],
    transactionOptions: { maxWait: 15000, timeout: 15000 },
  });
}

const processDatabase = globalThis as typeof globalThis & {
  health360Database?: PrismaClient;
};

/** Lazy server-only connection pool; route renders without a cookie need no database. */
export function getDatabase(): PrismaClient {
  return (processDatabase.health360Database ??= createDatabase());
}
