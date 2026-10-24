import "dotenv/config";
import { createDatabase } from "../../src/server/db/client";
import { inDatasetTransaction } from "../../src/server/db/repository";
import {
  demoDatasetId,
  newDemoSessionToken,
} from "../../src/server/demo/records";
import { publishReviewedPlan } from "../../src/server/preventive-plan/publication";
import { seedReviewedCycle } from "./reviewed-cycle";

// Isolated test-only producer setup. Never exposed by an app route or server action.
const db = createDatabase();
try {
  if (process.argv[2] === "create") {
    const token = newDemoSessionToken();
    const datasetId = demoDatasetId(token);
    const pending = process.argv[3] === "pending";
    const { patientId, review } = await seedReviewedCycle(
      db,
      datasetId,
      !pending,
    );
    if (!pending)
      await inDatasetTransaction(db, datasetId, (_repo, tx) =>
        publishReviewedPlan(tx, datasetId, patientId, review.id),
      );
    process.stdout.write(token);
  } else if (process.argv[2] === "remove") {
    await db.dataset.deleteMany({
      where: { id: demoDatasetId(process.argv[3]) },
    });
  } else throw new Error("Unsupported test fixture operation");
} finally {
  await db.$disconnect();
}
