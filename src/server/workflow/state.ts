import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { patientSchema } from "../../features/patients/contracts";
import {
  transition,
  type WorkflowStatus,
} from "../../features/workflow/workflow";
import { datasetRepository } from "../db/repository";
import {
  workflowTransitionInputSchema,
  workflowTransitionSchema,
  type WorkflowTransitionInput,
  type WorkflowTransition,
} from "./contracts";

type Database = PrismaClient | Prisma.TransactionClient;
export type WorkflowState = {
  status: WorkflowStatus;
  lastTransition: WorkflowTransition | null;
};

export class StaleStateError extends Error {
  constructor() {
    super("Stale workflow state");
    this.name = "StaleStateError";
  }
}

/** Internal administrative state; caller services must enforce clinical/actor preconditions. */
export async function getWorkflowState(
  db: Database,
  datasetId: string,
  patientId: string,
): Promise<WorkflowState> {
  z.string().min(1).parse(datasetId);
  z.string().min(1).parse(patientId);
  // Prisma transaction clients omit $connect; $transaction may still exist.
  if ("$connect" in db)
    return db.$transaction((tx) => getWorkflowState(tx, datasetId, patientId));
  const lockKey = JSON.stringify([datasetId, patientId]);
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;
  const patient = await db.patient.findUnique({
    where: { datasetId_id: { datasetId, id: patientId } },
  });
  if (!patient) throw new Error("Patient not found in dataset");
  const latest = await db.workflowTransition.findFirst({
    where: { datasetId, patientId },
    orderBy: { version: "desc" },
  });
  const lastTransition = latest
    ? workflowTransitionSchema.parse(latest.payload)
    : null;
  return {
    status: lastTransition?.to ?? patientSchema.parse(patient.payload).status,
    lastTransition,
  };
}

export async function getWorkflowStatus(
  db: Database,
  datasetId: string,
  patientId: string,
): Promise<WorkflowStatus> {
  return (await getWorkflowState(db, datasetId, patientId)).status;
}

/** Compare status and supplied reference fields atomically with caller writes. */
export async function transitionWorkflow(
  db: Database,
  datasetId: string,
  input: WorkflowTransitionInput,
): Promise<WorkflowStatus> {
  z.string().min(1).parse(datasetId);
  const parsed = workflowTransitionInputSchema.parse(input);
  if ("$connect" in db)
    return db.$transaction((tx) => transitionWorkflow(tx, datasetId, parsed));
  const current = await getWorkflowState(db, datasetId, parsed.patientId);
  if (current.status !== parsed.expectedFrom) throw new StaleStateError();
  const lastRefs = current.lastTransition?.refs;
  for (const key of [
    "profileVersion",
    "analysisId",
    "reviewId",
    "planId",
  ] as const) {
    const expected = parsed.expectedRefs?.[key];
    if (expected !== undefined && lastRefs?.[key] !== expected)
      throw new StaleStateError();
  }
  const to = transition(current.status, parsed.to);
  const { patientId, actor, reason, refs } = parsed;
  await datasetRepository(db, datasetId).append("workflowTransition", {
    id: randomUUID(),
    patientId,
    version: (current.lastTransition?.version ?? 0) + 1,
    from: current.status,
    to,
    occurredAt: new Date().toISOString(),
    actor,
    ...(reason === undefined ? {} : { reason }),
    ...(refs === undefined ? {} : { refs }),
  });
  return to;
}

export type { WorkflowTransitionInput, WorkflowTransition } from "./contracts";
