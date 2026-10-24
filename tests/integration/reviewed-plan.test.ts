import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, expect, it } from "vitest";
import { createDatabase } from "../../src/server/db/client";
import {
  datasetRepository,
  inDatasetTransaction,
} from "../../src/server/db/repository";
import { publishReviewedPlan } from "../../src/server/preventive-plan/publication";
import { getWorkflowStatus } from "../../src/server/workflow/state";
import { seedReviewedCycle } from "../support/reviewed-cycle";

if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable PostgreSQL database",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const datasets: string[] = [];
async function fixture(finalized = true) {
  const datasetId = `plan-test-${randomUUID()}`;
  datasets.push(datasetId);
  return { datasetId, ...(await seedReviewedCycle(db, datasetId, finalized)) };
}
afterAll(async () => {
  await db.dataset.deleteMany({ where: { id: { in: datasets } } });
  await db.$disconnect();
});

it("serializes concurrent publication into one immutable plan, event and transition", async () => {
  const { datasetId, patientId, review } = await fixture();
  const publish = () =>
    inDatasetTransaction(db, datasetId, (_repo, tx) =>
      publishReviewedPlan(tx, datasetId, patientId, review.id),
    );
  const [first, second] = await Promise.all([publish(), publish()]);
  expect(second).toEqual(first);
  const repo = datasetRepository(db, datasetId);
  expect(await repo.list("plan")).toHaveLength(1);
  expect(
    (await repo.list("event")).filter((e) => e.kind === "PLAN_PUBLISHED"),
  ).toHaveLength(1);
  expect(
    (await repo.list("workflowTransition")).filter(
      (t) => t.to === "PLAN_AVAILABLE",
    ),
  ).toHaveLength(1);
  expect(await getWorkflowStatus(db, datasetId, patientId)).toBe(
    "PLAN_AVAILABLE",
  );
});

it("rolls back plan, event and workflow transition when the enclosing finalization fails", async () => {
  const { datasetId, patientId, review } = await fixture();
  await expect(
    inDatasetTransaction(db, datasetId, async (_repo, tx) => {
      await publishReviewedPlan(tx, datasetId, patientId, review.id);
      throw new Error("Finalization transaction failed");
    }),
  ).rejects.toThrow("Finalization transaction failed");
  const repo = datasetRepository(db, datasetId);
  expect(await repo.list("plan")).toHaveLength(0);
  expect(
    (await repo.list("event")).some((e) => e.kind === "PLAN_PUBLISHED"),
  ).toBe(false);
  expect(await getWorkflowStatus(db, datasetId, patientId)).toBe(
    "MEDICAL_REVIEW_COMPLETED",
  );
});

it("rejects unfinished reviews and stale profiles without publishing", async () => {
  const pending = await fixture(false);
  await expect(
    inDatasetTransaction(db, pending.datasetId, (_repo, tx) =>
      publishReviewedPlan(
        tx,
        pending.datasetId,
        pending.patientId,
        pending.review.id,
      ),
    ),
  ).rejects.toThrow();
  const ready = await fixture();
  const repo = datasetRepository(db, ready.datasetId);
  await repo.append("profile", {
    ...ready.profile,
    id: "updated-profile",
    version: 2,
  });
  await expect(
    inDatasetTransaction(db, ready.datasetId, (_repo, tx) =>
      publishReviewedPlan(
        tx,
        ready.datasetId,
        ready.patientId,
        ready.review.id,
      ),
    ),
  ).rejects.toThrow();
  expect(await repo.list("plan")).toHaveLength(0);
});
