import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/server/db/client";
import {
  datasetRepository,
  inDatasetTransaction,
} from "../../src/server/db/repository";
import { seedRecords } from "../../src/server/db/records";
import { seedDataset } from "../../src/server/db/seed";
import {
  getWorkflowStatus,
  getWorkflowState,
  StaleStateError,
  transitionWorkflow,
} from "../../src/server/workflow/state";
if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable PostgreSQL database",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const a = `workflow-${randomUUID()}`,
  b = `workflow-${randomUUID()}`;
const patientId = "synthetic-patient-01";
beforeAll(async () => {
  await seedDataset(db, a);
  await seedDataset(db, b);
});
afterAll(async () => {
  await db.dataset.deleteMany({ where: { id: { in: [a, b] } } });
  await db.$disconnect();
});
const repo = datasetRepository(db, a);
describe("authoritative persisted workflow", () => {
  it("reads initial patient state and rejects missing patients/datasets", async () => {
    expect(await getWorkflowStatus(db, a, patientId)).toBe("NOT_STARTED");
    expect(await getWorkflowState(db, a, patientId)).toEqual({
      status: "NOT_STARTED",
      lastTransition: null,
    });
    await expect(getWorkflowStatus(db, a, "missing")).rejects.toThrow(
      "Patient not found",
    );
    await expect(getWorkflowStatus(db, "missing", patientId)).rejects.toThrow(
      "Patient not found",
    );
  });
  it("commits audited transitions without changing snapshots or other datasets", async () => {
    const patients = await repo.list("patient");
    expect(
      await transitionWorkflow(db, a, {
        patientId,
        expectedFrom: "NOT_STARTED",
        to: "INTAKE_IN_PROGRESS",
        actor: "patient",
        reason: "Synthetic intake started",
        refs: { profileVersion: 1 },
      }),
    ).toBe("INTAKE_IN_PROGRESS");
    expect(await getWorkflowStatus(db, a, patientId)).toBe(
      "INTAKE_IN_PROGRESS",
    );
    expect(await getWorkflowStatus(db, b, patientId)).toBe("NOT_STARTED");
    expect(await repo.list("patient")).toEqual(patients);
    expect(await repo.list("workflowTransition")).toEqual([
      expect.objectContaining({
        patientId,
        version: 1,
        from: "NOT_STARTED",
        to: "INTAKE_IN_PROGRESS",
        actor: "patient",
        reason: "Synthetic intake started",
        refs: { profileVersion: 1 },
      }),
    ]);
  });
  it("rejects stale, illegal and missing-patient writes with no history changes", async () => {
    const before = await repo.list("workflowTransition");
    await expect(
      transitionWorkflow(db, a, {
        patientId,
        expectedFrom: "NOT_STARTED",
        to: "INTAKE_IN_PROGRESS",
        actor: "system",
      }),
    ).rejects.toThrow("Stale workflow state");
    await expect(
      transitionWorkflow(db, a, {
        patientId,
        expectedFrom: "INTAKE_IN_PROGRESS",
        to: "PLAN_AVAILABLE",
        actor: "system",
      }),
    ).rejects.toThrow("Illegal workflow transition");
    await expect(
      transitionWorkflow(db, a, {
        patientId: "missing",
        expectedFrom: "NOT_STARTED",
        to: "INTAKE_IN_PROGRESS",
        actor: "patient",
      }),
    ).rejects.toThrow("Patient not found");
    expect(await repo.list("workflowTransition")).toEqual(before);
  });
  it("rolls back with a containing transaction and preserves full audit references", async () => {
    const input = {
      patientId,
      expectedFrom: "INTAKE_IN_PROGRESS",
      to: "INTAKE_COMPLETED",
      actor: "demo-physician",
      refs: {
        profileVersion: 2,
        analysisId: "synthetic-analysis",
        reviewId: "synthetic-review",
        planId: "synthetic-plan",
      },
    } as const;
    await expect(
      inDatasetTransaction(db, a, async (repository, tx) => {
        await repository.append("profile", {
          ...seedRecords.profile[0],
          id: "workflow-profile-2",
          version: 2,
        });
        await transitionWorkflow(tx, a, input);
        expect(await getWorkflowStatus(tx, a, patientId)).toBe(
          "INTAKE_COMPLETED",
        );
        throw new Error("rollback");
      }),
    ).rejects.toThrow("rollback");
    expect(await getWorkflowStatus(db, a, patientId)).toBe(
      "INTAKE_IN_PROGRESS",
    );
    expect(await repo.list("profile")).toHaveLength(1);
    await inDatasetTransaction(db, a, async (repository, tx) => {
      await repository.append("profile", {
        ...seedRecords.profile[0],
        id: "workflow-profile-2",
        version: 2,
      });
      await transitionWorkflow(tx, a, input);
    });
    expect(await repo.list("profile")).toHaveLength(2);
    expect((await repo.list("workflowTransition"))[1]).toEqual(
      expect.objectContaining({
        actor: "demo-physician",
        refs: input.refs,
        version: 2,
      }),
    );
  });
  it("serializes concurrent writers so one expectedFrom succeeds once", async () => {
    const input = {
      patientId,
      expectedFrom: "INTAKE_COMPLETED",
      to: "ANALYSIS_PENDING",
      actor: "system",
    } as const;
    const results = await Promise.allSettled([
      transitionWorkflow(db, a, input),
      transitionWorkflow(db, a, input),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(await getWorkflowStatus(db, a, patientId)).toBe("ANALYSIS_PENDING");
    expect(
      (await repo.list("workflowTransition")).map((r) => r.version),
    ).toEqual([1, 2, 3]);
  });
  it("rejects audit history edits and deletes but permits scoped dataset reset", async () => {
    await expect(
      db.workflowTransition.updateMany({
        where: { datasetId: a },
        data: { payload: { overwritten: true } },
      }),
    ).rejects.toThrow();
    await expect(
      db.workflowTransition.deleteMany({ where: { datasetId: a } }),
    ).rejects.toThrow();
    await db.dataset.delete({ where: { id: a } });
    expect(await repo.list("workflowTransition")).toEqual([]);
    expect(await getWorkflowStatus(db, b, patientId)).toBe("NOT_STARTED");
  });
  it("rejects a superseded analysis after an ABA retry and rolls back its records", async () => {
    for (const [expectedFrom, to, analysisId] of [
      ["NOT_STARTED", "INTAKE_IN_PROGRESS", "old-attempt"],
      ["INTAKE_IN_PROGRESS", "INTAKE_COMPLETED", "old-attempt"],
      ["INTAKE_COMPLETED", "ANALYSIS_PENDING", "old-attempt"],
      ["ANALYSIS_PENDING", "ANALYSIS_FAILED", "old-attempt"],
      ["ANALYSIS_FAILED", "ANALYSIS_PENDING", "new-attempt"],
    ] as const)
      await transitionWorkflow(db, b, {
        patientId,
        expectedFrom,
        to,
        actor: "system",
        refs: { analysisId, profileVersion: 1 },
      });
    const before = await getWorkflowState(db, b, patientId);
    expect(before.status).toBe("ANALYSIS_PENDING");
    expect(before.lastTransition?.refs?.analysisId).toBe("new-attempt");
    await expect(
      inDatasetTransaction(db, b, async (repository, tx) => {
        await repository.append("profile", {
          ...seedRecords.profile[0],
          id: "superseded-profile",
          version: 2,
        });
        await transitionWorkflow(tx, b, {
          patientId,
          expectedFrom: "ANALYSIS_PENDING",
          expectedRefs: { analysisId: "old-attempt", profileVersion: 1 },
          to: "MEDICAL_REVIEW_PENDING",
          actor: "system",
          refs: { analysisId: "old-attempt" },
        });
      }),
    ).rejects.toBeInstanceOf(StaleStateError);
    expect(await getWorkflowState(db, b, patientId)).toEqual(before);
    expect(await datasetRepository(db, b).list("profile")).toHaveLength(1);
    await transitionWorkflow(db, b, {
      patientId,
      expectedFrom: "ANALYSIS_PENDING",
      expectedRefs: { analysisId: "new-attempt", profileVersion: 1 },
      to: "MEDICAL_REVIEW_PENDING",
      actor: "system",
      refs: { analysisId: "new-attempt", profileVersion: 1 },
    });
    await expect(
      transitionWorkflow(db, b, {
        patientId,
        expectedFrom: "MEDICAL_REVIEW_PENDING",
        expectedRefs: { planId: "missing" },
        to: "MEDICAL_REVIEW_IN_PROGRESS",
        actor: "demo-physician",
      }),
    ).rejects.toBeInstanceOf(StaleStateError);
  });

  it("holds the same patient lock after getWorkflowState reads inside a caller transaction", async () => {
    await db.$transaction(async (tx) => {
      const state = await getWorkflowState(tx, b, patientId);
      expect(state.lastTransition).not.toBeNull();
      const key = JSON.stringify([b, patientId]);
      const rows = await db.$transaction(
        (other) =>
          other.$queryRaw<
            { acquired: boolean }[]
          >`SELECT pg_try_advisory_xact_lock(hashtextextended(${key}, 0)) AS acquired`,
      );
      expect(rows[0].acquired).toBe(false);
    });
  });
});
