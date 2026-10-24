import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { initialAnswers } from "../../src/features/health-intake/contracts";
import { createDatabase } from "../../src/server/db/client";
import { datasetRepository } from "../../src/server/db/repository";
import { seedDataset } from "../../src/server/db/seed";
import { completeIntake, startIntake } from "../../src/server/intake/service";
import {
  getWorkflowState,
  getWorkflowStatus,
  StaleStateError,
} from "../../src/server/workflow/state";

if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable PostgreSQL database",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const a = `intake-${randomUUID()}`,
  b = `intake-${randomUUID()}`;
const patientId = "synthetic-patient-01";
const answers = {
  ...(Object.fromEntries(
    Object.keys(initialAnswers).map((id) => [id, null]),
  ) as typeof initialAnswers),
  age: "60",
  priorScreening: "NEVER_SCREENED",
};
const profiles = async (datasetId: string) =>
  (await datasetRepository(db, datasetId).list("profile")).filter(
    (profile) => profile.patientId === patientId,
  );

beforeAll(async () => {
  await seedDataset(db, a);
  await seedDataset(db, b);
});
afterAll(async () => {
  await db.dataset.deleteMany({ where: { id: { in: [a, b] } } });
  await db.$disconnect();
});

describe("dataset-scoped intake wiring", () => {
  it("rejects completion before intake has started", async () => {
    await expect(
      completeIntake(db, a, patientId, answers, randomUUID()),
    ).rejects.toBeInstanceOf(StaleStateError);
  });
  it("first draft save starts intake once", async () => {
    await startIntake(db, a, patientId);
    await startIntake(db, a, patientId);
    const state = await getWorkflowState(db, a, patientId);
    expect(state.status).toBe("INTAKE_IN_PROGRESS");
    expect(state.lastTransition).toMatchObject({
      version: 1,
      actor: "patient",
    });
  });
  it("submit stores the next profile version and completes intake atomically", async () => {
    const before = await profiles(a);
    const next = Math.max(0, ...before.map((p) => p.version)) + 1;
    const completed = await completeIntake(
      db,
      a,
      patientId,
      answers,
      randomUUID(),
    );
    expect(completed.profile.version).toBe(next);
    const state = await getWorkflowState(db, a, patientId);
    expect(state.status).toBe("INTAKE_COMPLETED");
    expect(state.lastTransition?.refs).toEqual({ profileVersion: next });
    expect((await profiles(a)).length).toBe(before.length + 1);
    const intakes = await datasetRepository(db, a).list("intake");
    expect(intakes.some((i) => i.profileVersion === next)).toBe(true);
  });
  it("a repeated submit rolls back without a duplicate profile", async () => {
    const count = (await profiles(a)).length;
    await expect(
      completeIntake(db, a, patientId, answers, randomUUID()),
    ).rejects.toBeInstanceOf(StaleStateError);
    expect((await profiles(a)).length).toBe(count);
  });
  it("leaves other datasets untouched", async () => {
    expect(await getWorkflowStatus(db, b, patientId)).toBe("NOT_STARTED");
  });
});
