import type { PrismaClient } from "../../src/generated/prisma/client";
import type { WorkflowStatus } from "../../src/features/workflow/workflow";
import { planInput } from "../../src/features/preventive-plan/test-fixtures";
import { inDatasetTransaction } from "../../src/server/db/repository";
import {
  getWorkflowStatus,
  transitionWorkflow,
} from "../../src/server/workflow/state";
import { publishReviewedPlan } from "../../src/server/preventive-plan/publication";

/** Synthetic second-cycle producer fixture until intake/analysis/review producers land. */
export async function completeReassessmentFixture(
  db: PrismaClient,
  datasetId: string,
  patientId: string,
  failed = false,
) {
  return inDatasetTransaction(db, datasetId, async (repo, tx) => {
    if (
      (await getWorkflowStatus(tx, datasetId, patientId)) !==
      "REASSESSMENT_PENDING"
    )
      throw new Error("Start reassessment before completing the fixture cycle");
    const previous = (await repo.list("profile"))
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => b.version - a.version)[0];
    const now = new Date().toISOString();
    const profile = {
      ...previous,
      id: `${previous.id}-updated`,
      version: previous.version + 1,
      age: 51,
      updatedAt: now,
    };
    const input = planInput();
    const analysis = {
      ...input.analysis,
      id: "analysis-2",
      version: 2,
      patientId,
      profileVersion: profile.version,
      createdAt: now,
      status: failed ? ("BLOCKED" as const) : ("PRELIMINARY" as const),
      proposals: input.analysis.proposals.map((p) => ({
        ...p,
        id: `${p.id}-2`,
        analysisId: "analysis-2",
        title: p.id === "action" ? "Updated reviewed action wording" : p.title,
      })),
    };
    const review = {
      ...input.review,
      id: "review-2",
      patientId,
      analysisId: analysis.id,
      analysisVersion: analysis.version,
      completedAt: now,
      decisions: input.review.decisions.map((d) => ({
        ...d,
        proposalId: `${d.proposalId}-2`,
        recordedAt: now,
      })),
    };
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
    const event = (
      kind:
        | "PROFILE_UPDATED"
        | "INTAKE_COMPLETED"
        | "ANALYSIS_CREATED"
        | "ANALYSIS_FAILED"
        | "REVIEW_COMPLETED",
      entityId: string,
      entityVersion: number,
      provenance: "PATIENT_REPORTED" | "AI_GENERATED" | "PHYSICIAN_REVIEWED",
    ) =>
      repo.append("event", {
        id: `${kind}-second`,
        patientId,
        kind,
        entityId,
        entityVersion,
        occurredAt: now,
        provenance,
      });
    await advance("REASSESSMENT_PENDING", "INTAKE_IN_PROGRESS");
    await repo.append("profile", profile);
    await event(
      "PROFILE_UPDATED",
      profile.id,
      profile.version,
      "PATIENT_REPORTED",
    );
    await repo.append("intake", {
      id: "intake-2",
      patientId,
      profileVersion: profile.version,
      answers: {},
      completedAt: now,
    });
    await event(
      "INTAKE_COMPLETED",
      "intake-2",
      profile.version,
      "PATIENT_REPORTED",
    );
    await advance("INTAKE_IN_PROGRESS", "INTAKE_COMPLETED");
    await advance("INTAKE_COMPLETED", "ANALYSIS_PENDING");
    await repo.append("analysis", analysis);
    await event(
      failed ? "ANALYSIS_FAILED" : "ANALYSIS_CREATED",
      analysis.id,
      analysis.version,
      "AI_GENERATED",
    );
    if (failed) {
      await advance("ANALYSIS_PENDING", "ANALYSIS_FAILED");
      return null;
    }
    await advance("ANALYSIS_PENDING", "MEDICAL_REVIEW_PENDING");
    await advance("MEDICAL_REVIEW_PENDING", "MEDICAL_REVIEW_IN_PROGRESS");
    await repo.append("review", review);
    await event(
      "REVIEW_COMPLETED",
      review.id,
      review.version,
      "PHYSICIAN_REVIEWED",
    );
    await advance("MEDICAL_REVIEW_IN_PROGRESS", "MEDICAL_REVIEW_COMPLETED");
    return publishReviewedPlan(tx, datasetId, patientId, review.id);
  });
}
