import "dotenv/config";
import { strict as assert } from "node:assert";
import { createDatabase } from "../../src/server/db/client";
import { datasetRepository } from "../../src/server/db/repository";
import {
  newDemoSessionToken,
  demoDatasetId,
} from "../../src/server/demo/records";
import { workspaceId } from "../../src/features/clinical-review/reader";
import { getWorkflowStatus } from "../../src/server/workflow/state";
import { seedPhysicianReviewReady } from "./physician-clarification-fixture";

const db = createDatabase();
try {
  if (process.argv[2] === "create") {
    const token = newDemoSessionToken();
    const { analysis } = await seedPhysicianReviewReady(
      db,
      demoDatasetId(token),
    );
    process.stdout.write(
      JSON.stringify({ token, workspaceId: workspaceId(analysis) }),
    );
  } else if (
    process.argv[2] === "inspect" ||
    process.argv[2] === "assert-review"
  ) {
    const datasetId = demoDatasetId(process.argv[3]);
    const repo = datasetRepository(db, datasetId);
    const profiles = (await repo.list("profile")).sort(
      (a, b) => b.version - a.version,
    );
    const analyses = (await repo.list("analysis")).sort(
      (a, b) => b.version - a.version,
    );
    const reviews = await repo.list("review");
    assert.equal(profiles.length, 3);
    assert.equal(analyses.length, 2);
    assert.equal(analyses[0].profileVersion, profiles[0].version);
    assert.equal((await repo.list("plan")).length, 0);
    assert.equal(
      reviews.filter(
        (r) =>
          r.decisions.some((d) => d.decision === "CLARIFY") &&
          r.completedAt === null,
      ).length,
      1,
    );
    if (process.argv[2] === "inspect") {
      assert.equal(
        await getWorkflowStatus(db, datasetId, profiles[0].patientId),
        "MEDICAL_REVIEW_PENDING",
      );
      process.stdout.write(
        JSON.stringify({ workspaceId: workspaceId(analyses[0]) }),
      );
    } else {
      assert.equal(
        await getWorkflowStatus(db, datasetId, profiles[0].patientId),
        "MEDICAL_REVIEW_IN_PROGRESS",
      );
      assert.equal(reviews.length, 2);
      assert.equal(
        reviews.filter(
          (r) =>
            r.analysisId === analyses[0].id &&
            r.decisions.every((d) => d.decision === "PENDING"),
        ).length,
        1,
      );
    }
  } else if (process.argv[2] === "remove") {
    await db.dataset.deleteMany({
      where: { id: demoDatasetId(process.argv[3]) },
    });
  } else throw new Error("Unsupported fixture operation");
} finally {
  await db.$disconnect();
}
