import "server-only";
import type { PrismaClient } from "../../generated/prisma/client";
import {
  buildCompletedIntake,
  type CompletedIntake,
} from "../../features/health-intake/profile";
import { answersSchema } from "../../features/health-intake/contracts";
import { inDatasetTransaction } from "../db/repository";
import { getWorkflowStatus, transitionWorkflow } from "../workflow/state";

/** First draft save: NOT_STARTED → INTAKE_IN_PROGRESS. Later states are left unchanged. */
export async function startIntake(
  db: PrismaClient,
  datasetId: string,
  patientId: string,
): Promise<void> {
  await inDatasetTransaction(db, datasetId, async (_repo, tx) => {
    if ((await getWorkflowStatus(tx, datasetId, patientId)) !== "NOT_STARTED")
      return;
    await transitionWorkflow(tx, datasetId, {
      patientId,
      expectedFrom: "NOT_STARTED",
      to: "INTAKE_IN_PROGRESS",
      actor: "patient",
    });
  });
}

/**
 * Stores the confirmed intake, examinations and next immutable profile version and
 * completes intake in one dataset transaction. A stale or repeated submission throws
 * StaleStateError and rolls back every write.
 */
export async function completeIntake(
  db: PrismaClient,
  datasetId: string,
  patientId: string,
  answers: unknown,
  submissionId: string,
): Promise<CompletedIntake> {
  const parsed = answersSchema.parse(answers);
  return inDatasetTransaction(db, datasetId, async (repo, tx) => {
    const versions = (await repo.list("profile"))
      .filter((profile) => profile.patientId === patientId)
      .map((profile) => profile.version);
    const version = Math.max(0, ...versions) + 1;
    const completed = buildCompletedIntake(
      patientId,
      parsed,
      version,
      submissionId,
      new Date().toISOString(),
    );
    await transitionWorkflow(tx, datasetId, {
      patientId,
      expectedFrom: "INTAKE_IN_PROGRESS",
      to: "INTAKE_COMPLETED",
      actor: "patient",
      refs: { profileVersion: version },
    });
    for (const exam of completed.examinations)
      await repo.append("examination", exam);
    await repo.append("profile", completed.profile);
    await repo.append("intake", completed.intake);
    return completed;
  });
}
