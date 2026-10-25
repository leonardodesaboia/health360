import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, expect, it } from "vitest";
import { createDatabase } from "../../src/server/db/client";
import {
  datasetRepository,
  inDatasetTransaction,
} from "../../src/server/db/repository";
import { beginReassessment } from "../../src/server/health-timeline/reassessment";
import { readPatientHistory } from "../../src/server/health-timeline/reader";
import { readPatientPlan } from "../../src/server/preventive-plan/reader";
import { publishReviewedPlan } from "../../src/server/preventive-plan/publication";
import { getWorkflowStatus } from "../../src/server/workflow/state";
import { seedReviewedCycle } from "../support/reviewed-cycle";
import { completeReassessmentFixture } from "../support/reassessment-cycle";
import { startIntake, completeIntake } from "../../src/server/intake/service";
import { readIntakePrefill } from "../../src/server/intake/read";
import { analyzeSession } from "../../src/server/analysis/service";
import * as workflow from "../../src/server/workflow/state";

it("resumes real intake after reassessment and preserves the reviewed plan", async () => {
  const { datasetId, patientId, profile, plan, repo } = await fixture();
  await inDatasetTransaction(db, datasetId, (_repo, tx) =>
    beginReassessment(tx, datasetId, patientId, {
      planId: plan.id,
      profileVersion: profile.version,
    }),
  );
  await startIntake(db, datasetId, patientId);
  expect(await getWorkflowStatus(db, datasetId, patientId)).toBe(
    "INTAKE_IN_PROGRESS",
  );
  const prefill = await readIntakePrefill(db, datasetId, patientId);
  expect(prefill.answers.age).toBe(String(profile.age));
  const completed = await completeIntake(
    db,
    datasetId,
    patientId,
    { ...prefill.answers, age: "61" },
    randomUUID(),
  );
  expect(completed.profile.version).toBe(profile.version + 1);
  const restored = await readIntakePrefill(db, datasetId, patientId);
  expect(restored.profileVersion).toBe(profile.version + 1);
  expect(restored.answers).toEqual({ ...prefill.answers, age: "61" });
  expect(await getWorkflowStatus(db, datasetId, patientId)).toBe(
    "INTAKE_COMPLETED",
  );
  const result = await analyzeSession(
    db,
    { datasetId, patientId, caseId: "first-screening" },
    {
      workflow,
      audit: {
        provider: "mock",
        model: "deterministic-v1",
        promptId: "analysis",
        promptVersion: 1,
      },
      explain: async () => {
        throw new Error("Unknown facts must not reach the provider");
      },
    },
  );
  expect(result).toMatchObject({
    status: "RECORDED",
    workflowStatus: "CLARIFICATION_REQUIRED",
  });
  expect(
    (await repo.list("analysis")).some(
      (a) => a.profileVersion === completed.profile.version,
    ),
  ).toBe(true);
  expect(await repo.list("plan")).toEqual([plan]);
  expect((await repo.list("profile")).find((p) => p.id === profile.id)).toEqual(
    profile,
  );
});

if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable PostgreSQL database",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const datasets: string[] = [];
afterAll(async () => {
  await db.dataset.deleteMany({ where: { id: { in: datasets } } });
  await db.$disconnect();
});
async function fixture() {
  const datasetId = `history-${randomUUID()}`;
  datasets.push(datasetId);
  const { patientId, review, profile } = await seedReviewedCycle(db, datasetId);
  const plan = await inDatasetTransaction(db, datasetId, (_repo, tx) =>
    publishReviewedPlan(tx, datasetId, patientId, review.id),
  );
  return {
    datasetId,
    patientId,
    profile,
    plan,
    repo: datasetRepository(db, datasetId),
  };
}

it("starts reassessment once, preserves plan v1 and links an independently reviewed v2", async () => {
  const { datasetId, patientId, profile, plan, repo } = await fixture();
  const request = { planId: plan.id, profileVersion: profile.version };
  const start = () =>
    inDatasetTransaction(db, datasetId, (_repo, tx) =>
      beginReassessment(tx, datasetId, patientId, request),
    );
  await Promise.all([start(), start()]);
  expect(
    (await repo.list("event")).filter(
      (e) => e.kind === "REASSESSMENT_REQUESTED",
    ),
  ).toHaveLength(1);
  expect(
    (await readPatientPlan(repo, patientId, "REASSESSMENT_PENDING")).previous,
  ).toBe(true);
  const next = await completeReassessmentFixture(db, datasetId, patientId);
  expect(next).toMatchObject({
    version: 2,
    previousPlanId: plan.id,
    profileVersion: 2,
  });
  expect((await repo.list("plan")).find((p) => p.id === plan.id)).toEqual(plan);
  expect((await repo.list("profile")).find((p) => p.id === profile.id)).toEqual(
    profile,
  );
  const history = await readPatientHistory(repo, patientId, "PLAN_AVAILABLE");
  expect(history.plans.map((p) => p.version)).toEqual([2, 1]);
  expect(
    history.events.filter((e) => e.kind === "PLAN_PUBLISHED"),
  ).toHaveLength(2);
  expect(
    (await readPatientPlan(repo, patientId, "PLAN_AVAILABLE", plan.id))
      .previous,
  ).toBe(true);
});

it("keeps the reviewed prior plan readable when the second analysis fails", async () => {
  const { datasetId, patientId, profile, plan, repo } = await fixture();
  await inDatasetTransaction(db, datasetId, (_repo, tx) =>
    beginReassessment(tx, datasetId, patientId, {
      planId: plan.id,
      profileVersion: profile.version,
    }),
  );
  await completeReassessmentFixture(db, datasetId, patientId, true);
  expect(await getWorkflowStatus(db, datasetId, patientId)).toBe(
    "ANALYSIS_FAILED",
  );
  const data = await readPatientPlan(repo, patientId, "ANALYSIS_FAILED");
  expect(data.plan).toEqual(plan);
  expect(data.previous).toBe(true);
  expect(await repo.list("plan")).toHaveLength(1);
  const history = await readPatientHistory(repo, patientId, "ANALYSIS_FAILED");
  expect(history.events.some((e) => e.kind === "ANALYSIS_FAILED")).toBe(true);
});
