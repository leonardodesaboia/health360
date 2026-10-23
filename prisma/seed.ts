import "dotenv/config";
import { createDatabase } from "../src/server/db/client";
import { seedDataset } from "../src/server/db/seed";

const db = createDatabase();
try {
  await seedDataset(db, "local-synthetic-demo");
  console.info("Synthetic storage seed ready. No clinical analysis performed.");
} finally {
  await db.$disconnect();
}
