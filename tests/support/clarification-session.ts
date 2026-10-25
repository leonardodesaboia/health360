import "dotenv/config";
import { strict as assert } from "node:assert";
import { createDatabase } from "../../src/server/db/client";
import { datasetRepository } from "../../src/server/db/repository";
import {
  demoDatasetId,
  newDemoSessionToken,
} from "../../src/server/demo/records";
import { saveClarificationAnswers } from "../../src/server/clarification/service";
import { seedClarification } from "./clarification-fixture";

const db = createDatabase();
try {
  if (process.argv[2] === "create" || process.argv[2] === "reserve") {
    const token = newDemoSessionToken();
    const { session, form } = await seedClarification(db, demoDatasetId(token));
    if (process.argv[2] === "reserve")
      await saveClarificationAnswers(db, session.datasetId, session.patientId, {
        profileVersion: form.profileVersion,
        analysisId: form.analysisId,
        answers: { age: "60" },
      });
    process.stdout.write(JSON.stringify({ token }));
  } else if (process.argv[2] === "assert") {
    const repo = datasetRepository(db, demoDatasetId(process.argv[3]));
    const profiles = (await repo.list("profile")).sort(
      (a, b) => a.version - b.version,
    );
    assert.equal(profiles.length, 3);
    assert.equal(profiles[1].age, null);
    assert.equal(profiles[2].age, process.argv[4] === "unknown" ? null : 60);
    const analyses = (await repo.list("analysis")).sort(
      (a, b) => a.version - b.version,
    );
    assert.equal(analyses.length, 2);
    assert.equal(analyses[0].profileVersion, profiles[1].version);
    assert.equal(analyses[1].profileVersion, profiles[2].version);
    assert.equal(analyses[0].status, "BLOCKED");
    assert.equal(
      (await repo.list("event")).filter(
        (e) => e.kind === "CLARIFICATION_ANSWERED",
      ).length,
      1,
    );
    assert.equal((await repo.list("plan")).length, 0);
  } else if (process.argv[2] === "remove") {
    await db.dataset.deleteMany({
      where: { id: demoDatasetId(process.argv[3]) },
    });
  } else throw new Error("Unsupported fixture operation");
} finally {
  await db.$disconnect();
}
