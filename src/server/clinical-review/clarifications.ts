import "server-only";
import { z } from "zod";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { datasetRepository } from "../db/repository";
import { getWorkflowState } from "../workflow/state";

export type OpenClarificationRequest = {
  reviewId: string;
  reviewVersion: number;
  analysisId: string;
  analysisVersion: number;
  proposalId: string;
  /** Plain-English question written by the demo reviewer for the patient. */
  question: string;
  /** Intake FieldId the question targets; absent when the reviewer named no field. */
  targetField?: string;
};

/**
 * Typed physician CLARIFY requests that are still open: the latest workflow transition
 * is the demo reviewer's move to CLARIFICATION_REQUIRED and its draft review is incomplete.
 * Accepts a transaction so callers can read and act under the same patient lock.
 */
export async function listOpenClarificationRequests(
  db: PrismaClient | Prisma.TransactionClient,
  datasetId: string,
  patientId: string,
): Promise<OpenClarificationRequest[]> {
  z.string().min(1).parse(datasetId);
  z.string().min(1).parse(patientId);
  if ("$connect" in db)
    return db.$transaction((tx) =>
      listOpenClarificationRequests(tx, datasetId, patientId),
    );
  const { status, lastTransition } = await getWorkflowState(
    db,
    datasetId,
    patientId,
  );
  const reviewId = lastTransition?.refs?.reviewId;
  if (
    status !== "CLARIFICATION_REQUIRED" ||
    lastTransition?.actor !== "demo-physician" ||
    !reviewId
  )
    return [];
  const review = (await datasetRepository(db, datasetId).list("review"))
    .filter((r) => r.patientId === patientId && r.id === reviewId)
    .sort((a, b) => b.version - a.version)[0];
  if (
    !review ||
    review.completedAt ||
    review.analysisId !== lastTransition.refs?.analysisId
  )
    return [];
  return review.decisions.flatMap((d) =>
    d.decision === "CLARIFY" && d.clarification
      ? [
          {
            reviewId: review.id,
            reviewVersion: review.version,
            analysisId: review.analysisId,
            analysisVersion: review.analysisVersion,
            proposalId: d.proposalId,
            question: d.clarification.question,
            ...(d.clarification.targetField
              ? { targetField: d.clarification.targetField }
              : {}),
          },
        ]
      : [],
  );
}
