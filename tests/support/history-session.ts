import "dotenv/config";
import { createDatabase } from "../../src/server/db/client";
import {
  datasetRepository,
  inDatasetTransaction,
} from "../../src/server/db/repository";
import { strict as assert } from "node:assert";
import {
  demoDatasetId,
  newDemoSessionToken,
} from "../../src/server/demo/records";
import { loadDemoCase } from "../../src/server/demo/store";
import { publishReviewedPlan } from "../../src/server/preventive-plan/publication";
import { seedReviewedCycle } from "./reviewed-cycle";
import { completeReassessmentFixture } from "./reassessment-cycle";

const db = createDatabase();
try {
  if (process.argv[2] === "create") {
    const token = newDemoSessionToken();
    const datasetId = demoDatasetId(token);
    const { patientId, review } = await seedReviewedCycle(db, datasetId);
    const plan = await inDatasetTransaction(db, datasetId, (_repo, tx) =>
      publishReviewedPlan(tx, datasetId, patientId, review.id),
    );
    process.stdout.write(JSON.stringify({ token, planId: plan.id }));
  } else if (process.argv[2] === "complete") {
    const datasetId = demoDatasetId(process.argv[3]);
    const selected = await loadDemoCase(db, datasetId);
    if (!selected) throw new Error("Synthetic session unavailable");
    await completeReassessmentFixture(db, datasetId, selected.patient.id);
  } else if (process.argv[2] === "assert-intake") {
    const repo = datasetRepository(db, demoDatasetId(process.argv[3]));
    const profiles = (await repo.list("profile")).sort(
      (a, b) => a.version - b.version,
    );
    assert.equal(profiles.length, 2);
    assert.equal(profiles[0].age, 50);
    assert.equal(profiles[1].age, 61);
    assert.equal((await repo.list("analysis")).length, 2);
    assert.equal((await repo.list("plan")).length, 1);
  } else if (process.argv[2] === "remove") {
    await db.dataset.deleteMany({
      where: { id: demoDatasetId(process.argv[3]) },
    });
  } else throw new Error("Unsupported test fixture operation");
} finally {
  await db.$disconnect();
}
