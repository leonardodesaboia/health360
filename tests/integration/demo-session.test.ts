import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/server/db/client";
import { datasetRepository } from "../../src/server/db/repository";
import { demoCaseRecords } from "../../src/server/demo/records";
import { loadDemoCase, replaceDemoDataset } from "../../src/server/demo/store";

if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable PostgreSQL database",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const a = `test-demo-${randomUUID()}`;
const b = `test-demo-${randomUUID()}`;

afterAll(async () => {
  await db.dataset.deleteMany({ where: { id: { in: [a, b] } } });
  await db.$disconnect();
});

async function snapshot(datasetId: string) {
  const repo = datasetRepository(db, datasetId);
  return {
    dataset: await db.dataset.findUnique({ where: { id: datasetId } }),
    patient: await repo.list("patient"),
    profile: await repo.list("profile"),
    examination: await repo.list("examination"),
    analysis: await repo.list("analysis"),
    review: await repo.list("review"),
    plan: await repo.list("plan"),
    event: await repo.list("event"),
  };
}

describe("demo session storage", () => {
  it("returns null for a dataset that does not exist", async () => {
    expect(await loadDemoCase(db, `test-demo-${randomUUID()}`)).toBeNull();
  });

  it("selects a case and loads the same stored patient, profile and exams", async () => {
    await replaceDemoDataset(db, a, "repeat-screening");
    const expected = demoCaseRecords("repeat-screening");
    const loaded = await loadDemoCase(db, a);
    expect(loaded).toEqual({
      caseId: "repeat-screening",
      patient: expected.patient,
      profile: expected.profile,
      examinations: expected.examination,
    });
    const stored = await snapshot(a);
    expect(stored.analysis).toEqual([]);
    expect(stored.review).toEqual([]);
    expect(stored.plan).toEqual([]);
    expect(stored.event).toEqual([]);
  });

  it("resets idempotently to identical prepared records", async () => {
    await replaceDemoDataset(db, a, "repeat-screening");
    const first = await snapshot(a);
    await replaceDemoDataset(db, a, "repeat-screening");
    expect(await snapshot(a)).toEqual(first);
  });

  it("resets and switches only the selected session dataset", async () => {
    await replaceDemoDataset(db, b, "first-screening");
    const other = await snapshot(b);
    await replaceDemoDataset(db, a, "first-screening");
    await replaceDemoDataset(db, a, "repeat-screening");
    expect(await snapshot(b)).toEqual(other);
    expect((await loadDemoCase(db, a))?.caseId).toBe("repeat-screening");
    expect((await loadDemoCase(db, b))?.caseId).toBe("first-screening");
  });

  it("switching case replaces records instead of mixing patients", async () => {
    await replaceDemoDataset(db, a, "first-screening");
    const stored = await snapshot(a);
    expect(stored.patient.map((p) => p.id)).toEqual([
      "synthetic-first-screening",
    ]);
    expect(stored.examination).toEqual([]);
  });

  it("rejects an invalid case ID before writing and keeps the dataset", async () => {
    await replaceDemoDataset(db, a, "repeat-screening");
    const before = await snapshot(a);
    await expect(
      replaceDemoDataset(db, a, "storage-only" as never),
    ).rejects.toThrow();
    expect(await snapshot(a)).toEqual(before);
  });

  it("ignores a dataset whose stored case is not a prepared demo case", async () => {
    const id = `test-demo-${randomUUID()}`;
    await db.dataset.create({ data: { id, scenarioId: "storage-only" } });
    try {
      expect(await loadDemoCase(db, id)).toBeNull();
    } finally {
      await db.dataset.delete({ where: { id } });
    }
  });

  it("serializes concurrent resets for one session", async () => {
    await Promise.all([
      replaceDemoDataset(db, a, "first-screening"),
      replaceDemoDataset(db, a, "first-screening"),
    ]);
    expect((await snapshot(a)).patient).toHaveLength(1);
  });
});
