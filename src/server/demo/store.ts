import "server-only";
import { z } from "zod";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { datasetRepository } from "../db/repository";
import { getWorkflowState, getWorkflowStatus } from "../workflow/state";
import {
  demoCaseIdSchema,
  type DemoCaseId,
  type StoredDemoCase,
} from "./contracts";
import { demoCaseRecords } from "./records";

async function replaceRecords(
  tx: Prisma.TransactionClient,
  datasetId: string,
  caseId: DemoCaseId,
) {
  // Coordinate reset with in-flight workflow transitions before deleting their records.
  const patients = await tx.patient.findMany({
    where: { datasetId },
    orderBy: { id: "asc" },
  });
  for (const patient of patients)
    await getWorkflowState(tx, datasetId, patient.id);
  const records = demoCaseRecords(caseId);
  await tx.dataset.deleteMany({ where: { id: datasetId } });
  await tx.dataset.create({ data: { id: datasetId, scenarioId: caseId } });
  const repository = datasetRepository(tx, datasetId);
  await repository.append("patient", records.patient);
  for (const examination of records.examination)
    await repository.append("examination", examination);
  await repository.append("profile", records.profile);
}

/** Internal storage API: caller must derive datasetId from the browser's server-side session. */
export async function replaceDemoDataset(
  db: PrismaClient,
  datasetId: string,
  caseId: DemoCaseId,
): Promise<void> {
  z.string().min(1).parse(datasetId);
  const parsed = demoCaseIdSchema.parse(caseId);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${datasetId}))`;
    await replaceRecords(tx, datasetId, parsed);
  });
}

/** Chooses the current stored case under the reset lock, avoiding a stale case switch. */
export async function resetDemoDataset(
  db: PrismaClient,
  datasetId: string,
): Promise<boolean> {
  z.string().min(1).parse(datasetId);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${datasetId}))`;
    const dataset = await tx.dataset.findUnique({ where: { id: datasetId } });
    const parsed = demoCaseIdSchema.safeParse(dataset?.scenarioId);
    if (!parsed.success) return false;
    await replaceRecords(tx, datasetId, parsed.data);
    return true;
  });
}

/** Read one coherent stored snapshot. Never reseeds missing or malformed session data. */
export async function loadDemoCase(
  db: PrismaClient,
  datasetId: string,
): Promise<StoredDemoCase | null> {
  z.string().min(1).parse(datasetId);
  return db.$transaction(
    async (tx) => {
      const dataset = await tx.dataset.findUnique({ where: { id: datasetId } });
      const parsed = demoCaseIdSchema.safeParse(dataset?.scenarioId);
      if (!parsed.success) return null;
      const patientId = demoCaseRecords(parsed.data).patient.id;
      const repository = datasetRepository(tx, datasetId);
      const patient = (await repository.list("patient")).find(
        (p) => p.id === patientId,
      );
      const profile = (await repository.list("profile"))
        .filter((p) => p.patientId === patientId)
        .sort((a, b) => b.version - a.version)[0];
      if (!patient || !profile)
        throw new Error("Selected demo case is incomplete");
      const examinations = (await repository.list("examination")).filter(
        (e) =>
          e.patientId === patientId && profile.examinationIds.includes(e.id),
      );
      if (examinations.length !== profile.examinationIds.length)
        throw new Error("Selected demo case is incomplete");
      return {
        caseId: parsed.data,
        patient: {
          ...patient,
          status: await getWorkflowStatus(tx, datasetId, patientId),
        },
        profile,
        examinations,
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}
