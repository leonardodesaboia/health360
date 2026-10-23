import "server-only";
import { z } from "zod";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { validateRecord, type RecordKind, type Records } from "./records";

export function datasetRepository(
  db: Prisma.TransactionClient,
  datasetId: string,
) {
  z.string().min(1).parse(datasetId);
  const readers = {
    workflowTransition: () =>
      db.workflowTransition.findMany({
        where: { datasetId },
        orderBy: [{ patientId: "asc" }, { version: "asc" }],
      }),
    patient: () => db.patient.findMany({ where: { datasetId } }),
    profile: () => db.healthProfile.findMany({ where: { datasetId } }),
    examination: () =>
      db.previousExamination.findMany({ where: { datasetId } }),
    intake: () => db.intakeResponse.findMany({ where: { datasetId } }),
    context: () => db.clinicalContext.findMany({ where: { datasetId } }),
    analysis: () => db.aIAnalysis.findMany({ where: { datasetId } }),
    review: () => db.medicalReview.findMany({ where: { datasetId } }),
    plan: () => db.preventivePlan.findMany({ where: { datasetId } }),
    event: () =>
      db.timelineEvent.findMany({
        where: { datasetId },
        orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
      }),
  };
  return {
    async list<K extends RecordKind>(kind: K): Promise<Records[K][]> {
      const rows = await readers[kind]();
      return rows.map(({ payload }) => validateRecord(kind, payload));
    },
    async append(kind: RecordKind, input: unknown): Promise<void> {
      // Parse in each branch to retain discriminated entity types.
      switch (kind) {
        case "workflowTransition": {
          const r = validateRecord(kind, input);
          await db.workflowTransition.create({
            data: {
              datasetId,
              id: r.id,
              patientId: r.patientId,
              version: r.version,
              payload: r,
            },
          });
          break;
        }
        case "patient": {
          const r = validateRecord(kind, input);
          await db.patient.create({
            data: { datasetId, id: r.id, payload: r },
          });
          break;
        }
        case "examination": {
          const r = validateRecord(kind, input);
          await db.previousExamination.create({
            data: { datasetId, id: r.id, patientId: r.patientId, payload: r },
          });
          break;
        }
        case "profile": {
          const r = validateRecord(kind, input);
          await db.healthProfile.create({
            data: {
              datasetId,
              id: r.id,
              patientId: r.patientId,
              version: r.version,
              payload: r,
              examinations: {
                create: r.examinationIds.map((examinationId) => ({
                  examinationId,
                })),
              },
            },
          });
          break;
        }
        case "intake": {
          const r = validateRecord(kind, input);
          await db.intakeResponse.create({
            data: {
              datasetId,
              id: r.id,
              patientId: r.patientId,
              profileVersion: r.profileVersion,
              payload: r,
            },
          });
          break;
        }
        case "context": {
          const r = validateRecord(kind, input);
          await db.clinicalContext.create({
            data: { datasetId, id: r.id, version: r.version, payload: r },
          });
          break;
        }
        case "analysis": {
          const r = validateRecord(kind, input);
          await db.aIAnalysis.create({
            data: {
              datasetId,
              id: r.id,
              patientId: r.patientId,
              version: r.version,
              profileVersion: r.profileVersion,
              contextId: r.contextId,
              contextVersion: r.contextVersion,
              payload: r,
              proposals: {
                create: r.proposals.map((p) => ({ id: p.id, payload: p })),
              },
            },
          });
          break;
        }
        case "review": {
          const r = validateRecord(kind, input);
          await db.medicalReview.create({
            data: {
              datasetId,
              id: r.id,
              patientId: r.patientId,
              version: r.version,
              analysisId: r.analysisId,
              analysisVersion: r.analysisVersion,
              payload: r,
            },
          });
          break;
        }
        case "plan": {
          const r = validateRecord(kind, input);
          await db.preventivePlan.create({
            data: {
              datasetId,
              id: r.id,
              patientId: r.patientId,
              version: r.version,
              profileVersion: r.profileVersion,
              reviewId: r.reviewId,
              reviewVersion: r.reviewVersion,
              previousPlanId: r.previousPlanId,
              payload: r,
            },
          });
          break;
        }
        case "event": {
          const r = validateRecord(kind, input);
          await db.timelineEvent.create({
            data: {
              datasetId,
              id: r.id,
              patientId: r.patientId,
              occurredAt: new Date(r.occurredAt),
              payload: r,
            },
          });
          break;
        }
        default:
          throw new Error("Unsupported record kind");
      }
    },
  };
}

export type DatasetRepository = ReturnType<typeof datasetRepository>;

export function inDatasetTransaction<T>(
  db: PrismaClient,
  datasetId: string,
  operation: (
    repository: DatasetRepository,
    tx: Prisma.TransactionClient,
  ) => Promise<T>,
) {
  return db.$transaction((tx) =>
    operation(datasetRepository(tx, datasetId), tx),
  );
}
