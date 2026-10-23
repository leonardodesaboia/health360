import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/server/db/client";
import {
  datasetRepository,
  inDatasetTransaction,
} from "../../src/server/db/repository";
import { seedDataset } from "../../src/server/db/seed";
import { seedRecords } from "../../src/server/db/records";

// The integration command never defaults to the development database.
if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable PostgreSQL database",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const a = `test-${randomUUID()}`;
const b = `test-${randomUUID()}`;
const repo = datasetRepository(db, a);

beforeAll(async () => {
  await seedDataset(db, a);
  await seedDataset(db, b);
});
afterAll(async () => {
  await db.dataset.deleteMany({ where: { id: { in: [a, b] } } });
  await db.$disconnect();
});

describe("PostgreSQL synthetic persistence", () => {
  it("seeds idempotently, round-trips unknowns and leaves fixtures unchanged", async () => {
    const before = JSON.stringify(seedRecords);
    await seedDataset(db, a);
    expect(await repo.list("profile")).toEqual(seedRecords.profile);
    expect(await repo.list("analysis")).toEqual(seedRecords.analysis);
    expect(JSON.stringify(seedRecords)).toBe(before);
  });

  it("rejects duplicate profile versions and preserves the original", async () => {
    await expect(
      repo.append("profile", {
        ...seedRecords.profile[0],
        id: "duplicate-version",
      }),
    ).rejects.toThrow();
    expect(await repo.list("profile")).toEqual(seedRecords.profile);
  });

  it("rejects missing and cross-dataset profile/context references", async () => {
    await expect(
      repo.append("analysis", {
        ...seedRecords.analysis[0],
        id: "missing-profile",
        version: 2,
        profileVersion: 99,
      }),
    ).rejects.toThrow();
    await expect(
      repo.append("analysis", {
        ...seedRecords.analysis[0],
        id: "missing-context",
        version: 2,
        contextVersion: 99,
      }),
    ).rejects.toThrow();
    await db.dataset.create({ data: { id: `${a}-empty` } });
    try {
      await expect(
        datasetRepository(db, `${a}-empty`).append(
          "profile",
          seedRecords.profile[0],
        ),
      ).rejects.toThrow();
    } finally {
      await db.dataset.delete({ where: { id: `${a}-empty` } });
    }
  });

  it("rolls back all writes when a later operation fails", async () => {
    await expect(
      inDatasetTransaction(db, a, async (tx) => {
        await tx.append("patient", {
          ...seedRecords.patient[0],
          id: "rolled-back",
        });
        await tx.append("profile", {
          ...seedRecords.profile[0],
          id: "bad",
          patientId: "missing",
        });
      }),
    ).rejects.toThrow();
    expect((await repo.list("patient")).map((p) => p.id)).not.toContain(
      "rolled-back",
    );
  });

  it("rejects direct updates/deletes of historical versions", async () => {
    await expect(
      db.healthProfile.update({
        where: {
          datasetId_id: { datasetId: a, id: seedRecords.profile[0].id },
        },
        data: { payload: { overwritten: true } },
      }),
    ).rejects.toThrow();
    await expect(
      db.healthProfile.deleteMany({ where: { datasetId: a } }),
    ).rejects.toThrow();
    expect(await repo.list("profile")).toEqual(seedRecords.profile);
  });

  it("appends ordered linked events and rejects missing entity versions", async () => {
    const event = {
      id: "event-01",
      patientId: seedRecords.patient[0].id,
      occurredAt: "2026-10-22T00:00:00Z",
      kind: "PROFILE_UPDATED",
      entityId: seedRecords.profile[0].id,
      entityVersion: 1,
      provenance: "PATIENT_REPORTED",
    };
    await repo.append("event", event);
    await expect(
      repo.append("event", { ...event, id: "bad-event", entityVersion: 99 }),
    ).rejects.toThrow();
    expect(await repo.list("event")).toEqual([event]);
  });

  it("rejects plans/reviews without parents and keeps deletion isolated", async () => {
    await expect(
      repo.append("review", {
        id: "bad-review",
        version: 1,
        patientId: seedRecords.patient[0].id,
        analysisId: "missing",
        analysisVersion: 1,
        reviewerId: "synthetic-reviewer",
        completedAt: null,
        decisions: [],
      }),
    ).rejects.toThrow();
    await expect(
      repo.append("plan", {
        id: "bad-plan",
        patientId: seedRecords.patient[0].id,
        version: 1,
        reviewId: "missing",
        reviewVersion: 1,
        profileVersion: 1,
        publishedAt: "2026-10-22T00:00:00Z",
        previousPlanId: null,
        actions: [],
        reviewedRedundancies: [],
        pendingInformation: [],
      }),
    ).rejects.toThrow();
    await db.dataset.delete({ where: { id: a } });
    expect(await repo.list("profile")).toEqual([]);
    expect(await datasetRepository(db, b).list("profile")).toEqual(
      seedRecords.profile,
    );
  });
});
