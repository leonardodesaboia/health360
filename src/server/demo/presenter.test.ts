import { expect, it, vi } from "vitest";
import type { PrismaClient } from "../../generated/prisma/client";
import { demoCaseRecords } from "./records";
import { loadDemoPresenterCase } from "./store";

function storage(scenarioId: string | null = "alex-review") {
  const records = demoCaseRecords("first-screening");
  const tx = {
    dataset: { findUnique: vi.fn().mockResolvedValue({ scenarioId }) },
    patient: {
      findUnique: vi.fn().mockResolvedValue({ payload: records.patient }),
    },
  };
  const transaction = vi.fn(async (read: (value: typeof tx) => unknown) =>
    read(tx),
  );
  return {
    tx,
    db: { $transaction: transaction } as unknown as PrismaClient,
    transaction,
  };
}

it("loads only case identity for presenter controls without clinical or workflow reads", async () => {
  const { tx, db, transaction } = storage();
  expect(await loadDemoPresenterCase(db, "browser-dataset")).toEqual({
    caseId: "first-screening",
    preparedStateId: "alex-review",
    displayName: "Alex Example",
  });
  expect(tx.dataset.findUnique).toHaveBeenCalledWith({
    where: { id: "browser-dataset" },
  });
  expect(tx.patient.findUnique).toHaveBeenCalledWith({
    where: {
      datasetId_id: {
        datasetId: "browser-dataset",
        id: demoCaseRecords("first-screening").patient.id,
      },
    },
  });
  expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
    isolationLevel: "RepeatableRead",
  });
});

it("returns no presenter identity for a missing or unsupported dataset", async () => {
  const { tx, db } = storage(null);
  expect(await loadDemoPresenterCase(db, "missing-dataset")).toBeNull();
  expect(tx.patient.findUnique).not.toHaveBeenCalled();
});

it("never substitutes a fixture name when the stored patient is missing or foreign", async () => {
  const { tx, db } = storage();
  tx.patient.findUnique.mockResolvedValueOnce(null);
  await expect(loadDemoPresenterCase(db, "browser-dataset")).rejects.toThrow();
  tx.patient.findUnique.mockResolvedValueOnce({
    payload: {
      ...demoCaseRecords("first-screening").patient,
      id: "foreign-patient",
    },
  });
  await expect(loadDemoPresenterCase(db, "browser-dataset")).rejects.toThrow();
});

it("propagates storage failure instead of claiming a selected case", async () => {
  const { tx, db } = storage();
  tx.dataset.findUnique.mockRejectedValue(new Error("Storage unavailable"));
  await expect(loadDemoPresenterCase(db, "browser-dataset")).rejects.toThrow(
    "Storage unavailable",
  );
});
