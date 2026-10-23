import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/server/db/client";
import { datasetRepository } from "../../src/server/db/repository";
import { seedDataset } from "../../src/server/db/seed";
import { seedRecords } from "../../src/server/db/records";

if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable PostgreSQL database",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const datasetId = `timeline-kinds-${randomUUID()}`;
const foreignDatasetId = `${datasetId}-foreign`;
const repository = datasetRepository(db, datasetId);
const patientId = seedRecords.patient[0].id;
const reviewId = "synthetic-draft-review";
const cases = [
  ["REVIEW_UPDATED", reviewId],
  ["REVIEW_CLARIFICATION_REQUESTED", reviewId],
  ["ANALYSIS_FAILED", seedRecords.analysis[0].id],
  ["CLARIFICATION_REQUESTED", seedRecords.analysis[0].id],
  ["CLARIFICATION_ANSWERED", seedRecords.profile[0].id],
  ["REASSESSMENT_REQUESTED", seedRecords.profile[0].id],
] as const;

beforeAll(async () => {
  await seedDataset(db, datasetId);
  await seedDataset(db, foreignDatasetId);
  await repository.append("review", {
    id: reviewId,
    patientId,
    version: 1,
    analysisId: seedRecords.analysis[0].id,
    analysisVersion: 1,
    reviewerId: "demo-physician",
    completedAt: null,
    decisions: [],
  });
  const foreign = datasetRepository(db, foreignDatasetId);
  await foreign.append("profile", {
    ...seedRecords.profile[0],
    id: "foreign-profile",
    version: 2,
  });
  await foreign.append("analysis", {
    ...seedRecords.analysis[0],
    id: "foreign-analysis",
    version: 2,
  });
  await foreign.append("review", {
    id: "foreign-review",
    patientId,
    version: 2,
    analysisId: seedRecords.analysis[0].id,
    analysisVersion: 1,
    reviewerId: "demo-physician",
    completedAt: null,
    decisions: [],
  });
});
afterAll(async () => {
  await db.dataset.deleteMany({
    where: { id: { in: [datasetId, foreignDatasetId] } },
  });
  await db.$disconnect();
});

describe("timeline event entity references", () => {
  it.each(cases)(
    "round-trips %s against its exact entity version",
    async (kind, entityId) => {
      const event = {
        id: randomUUID(),
        patientId,
        occurredAt: "2026-10-23T00:00:00Z",
        kind,
        entityId,
        entityVersion: 1,
        provenance: "SYSTEM_STRUCTURED",
      };
      await repository.append("event", event);
      expect(await repository.list("event")).toContainEqual(event);
    },
  );
  it.each(cases)(
    "rejects absent, wrong-kind and foreign %s targets",
    async (kind, entityId) => {
      const base = {
        patientId,
        occurredAt: "2026-10-23T00:00:00Z",
        kind,
        entityId,
        entityVersion: 1,
        provenance: "SYSTEM_STRUCTURED",
      };
      await expect(
        repository.append("event", {
          ...base,
          id: randomUUID(),
          entityVersion: 99,
        }),
      ).rejects.toThrow();
      const wrongId =
        entityId === reviewId ? seedRecords.profile[0].id : reviewId;
      await expect(
        repository.append("event", {
          ...base,
          id: randomUUID(),
          entityId: wrongId,
        }),
      ).rejects.toThrow();
      const foreignId =
        entityId === reviewId
          ? "foreign-review"
          : entityId === seedRecords.analysis[0].id
            ? "foreign-analysis"
            : "foreign-profile";
      await expect(
        repository.append("event", {
          ...base,
          id: randomUUID(),
          entityId: foreignId,
          entityVersion: 2,
        }),
      ).rejects.toThrow();
    },
  );
  it("rejects unsupported kinds at the SQL boundary", async () => {
    await expect(
      db.timelineEvent.create({
        data: {
          datasetId,
          id: randomUUID(),
          patientId,
          occurredAt: new Date(),
          payload: {
            kind: "AUTOMATIC_APPROVAL",
            entityId: reviewId,
            entityVersion: 1,
          },
        },
      }),
    ).rejects.toThrow(/Unsupported timeline kind/);
  });
});
