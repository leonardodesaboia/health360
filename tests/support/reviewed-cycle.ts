import type { PrismaClient } from "../../src/generated/prisma/client";
import type { WorkflowStatus } from "../../src/features/workflow/workflow";
import { planInput } from "../../src/features/preventive-plan/test-fixtures";
import {
  datasetRepository,
  inDatasetTransaction,
} from "../../src/server/db/repository";
import { replaceDemoDataset } from "../../src/server/demo/store";
import { transitionWorkflow } from "../../src/server/workflow/state";

/** Synthetic producer fixtures only; never imported by application code. */
export async function seedReviewedCycle(
  db: PrismaClient,
  datasetId: string,
  finalized = true,
) {
  await replaceDemoDataset(db, datasetId, "first-screening");
  const repo = datasetRepository(db, datasetId);
  const profile = (await repo.list("profile"))[0];
  const input = planInput();
  const patientId = profile.patientId;
  const now = new Date().toISOString();
  const analysis = {
    ...input.analysis,
    patientId,
    profileVersion: profile.version,
    createdAt: now,
  };
  const review = {
    ...input.review,
    patientId,
    completedAt: finalized ? now : null,
    decisions: input.review.decisions.map((d) => ({ ...d, recordedAt: now })),
  };
  await inDatasetTransaction(db, datasetId, async (repository, tx) => {
    const advance = (expectedFrom: WorkflowStatus, to: WorkflowStatus) =>
      transitionWorkflow(tx, datasetId, {
        patientId,
        expectedFrom,
        to,
        actor: "system",
        refs: {
          profileVersion: profile.version,
          analysisId: analysis.id,
          reviewId: review.id,
        },
      });
    await repository.append("event", {
      id: "profile-created",
      patientId,
      occurredAt: now,
      kind: "PROFILE_UPDATED",
      entityId: profile.id,
      entityVersion: profile.version,
      provenance: "PATIENT_REPORTED",
    });
    await advance("NOT_STARTED", "INTAKE_IN_PROGRESS");
    const intake = {
      id: "fixture-intake",
      patientId,
      profileVersion: profile.version,
      answers: {},
      completedAt: now,
    };
    await repository.append("intake", intake);
    await repository.append("event", {
      id: "intake-completed",
      patientId,
      occurredAt: now,
      kind: "INTAKE_COMPLETED",
      entityId: intake.id,
      entityVersion: profile.version,
      provenance: "PATIENT_REPORTED",
    });
    await advance("INTAKE_IN_PROGRESS", "INTAKE_COMPLETED");
    await advance("INTAKE_COMPLETED", "ANALYSIS_PENDING");
    await repository.append("analysis", analysis);
    await repository.append("event", {
      id: "analysis-created",
      patientId,
      occurredAt: now,
      kind: "ANALYSIS_CREATED",
      entityId: analysis.id,
      entityVersion: analysis.version,
      provenance: "AI_GENERATED",
    });
    await advance("ANALYSIS_PENDING", "MEDICAL_REVIEW_PENDING");
    await advance("MEDICAL_REVIEW_PENDING", "MEDICAL_REVIEW_IN_PROGRESS");
    await repository.append("review", review);
    if (finalized) {
      await advance("MEDICAL_REVIEW_IN_PROGRESS", "MEDICAL_REVIEW_COMPLETED");
      await repository.append("event", {
        id: "review-completed",
        patientId,
        occurredAt: now,
        kind: "REVIEW_COMPLETED",
        entityId: review.id,
        entityVersion: review.version,
        provenance: "PHYSICIAN_REVIEWED",
      });
    }
  });
  return { patientId, profile, analysis, review };
}
