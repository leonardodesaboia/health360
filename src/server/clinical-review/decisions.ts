import "server-only";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { clinicalContextSchema } from "../../features/patients/contracts";
import { z } from "zod";
import type { PrismaClient } from "../../generated/prisma/client";
import { findWorkspace } from "../../features/clinical-review/reader";
import {
  prepareReview,
  reviewSubmissionSchema,
} from "../../features/clinical-review/decisions";
import { inDatasetTransaction } from "../db/repository";
import { loadClinicalContext } from "../clinical-rules/context";
import { publishReviewedPlan } from "../preventive-plan/publication";
import type { ReviewWorkspace } from "../../features/clinical-review/reader";
import {
  getWorkflowState,
  getWorkflowStatus,
  transitionWorkflow,
} from "../workflow/state";
import type { DemoSession } from "../demo/contracts";

/** Internal synthetic-demo service. The action resolves session scope on the server. */
export async function recordReview(
  db: PrismaClient,
  session: Pick<DemoSession, "datasetId" | "patientId"> | null,
  id: string,
  input: unknown,
) {
  if (!session)
    throw new Error("Select a demonstration session before reviewing.");
  z.string().min(1).max(512).parse(id);
  const submission = reviewSubmissionSchema.parse(input);
  return inDatasetTransaction(db, session.datasetId, async (repository, tx) => {
    // The canonical workflow reader acquires the patient lock before version reads.
    const status = await getWorkflowStatus(
      tx,
      session.datasetId,
      session.patientId,
    );
    const [patients, profiles, examinations, analyses, contexts, reviews] =
      await Promise.all([
        repository.list("patient"),
        repository.list("profile"),
        repository.list("examination"),
        repository.list("analysis"),
        repository.list("context"),
        repository.list("review"),
      ]);
    const workspace = findWorkspace(
      { patients, profiles, examinations, analyses, contexts, reviews },
      session.patientId,
      id,
    );
    if (!workspace)
      throw new Error("Review is unavailable in this demonstration session.");
    validateReviewReferences(workspace);
    const review = prepareReview(
      workspace,
      submission,
      new Date().toISOString(),
      randomUUID(),
    );
    if (
      status !== "MEDICAL_REVIEW_PENDING" &&
      status !== "MEDICAL_REVIEW_IN_PROGRESS"
    )
      throw new Error(
        "This workflow is not open for review. Reload the current case.",
      );
    const refs = {
      profileVersion: workspace.profile.version,
      analysisId: workspace.analysis.id,
      reviewId: review.id,
    };
    if (status === "MEDICAL_REVIEW_PENDING") {
      await transitionWorkflow(tx, session.datasetId, {
        patientId: session.patientId,
        expectedFrom: status,
        expectedRefs: {
          profileVersion: workspace.profile.version,
          analysisId: workspace.analysis.id,
        },
        to: "MEDICAL_REVIEW_IN_PROGRESS",
        actor: "demo-physician",
        refs,
      });
    }
    await repository.append("review", review);
    const clarification = review.decisions.some(
      (d) => d.decision === "CLARIFY",
    );
    await repository.append("event", {
      id: randomUUID(),
      patientId: session.patientId,
      occurredAt: review.decisions[0].recordedAt,
      kind: review.completedAt
        ? "REVIEW_COMPLETED"
        : clarification
          ? "REVIEW_CLARIFICATION_REQUESTED"
          : "REVIEW_UPDATED",
      entityId: review.id,
      entityVersion: review.version,
      provenance: "PHYSICIAN_REVIEWED",
    });
    if (review.completedAt || clarification) {
      await transitionWorkflow(tx, session.datasetId, {
        patientId: session.patientId,
        expectedFrom: "MEDICAL_REVIEW_IN_PROGRESS",
        expectedRefs: {
          profileVersion: workspace.profile.version,
          analysisId: workspace.analysis.id,
        },
        to: clarification
          ? "CLARIFICATION_REQUIRED"
          : "MEDICAL_REVIEW_COMPLETED",
        actor: "demo-physician",
        refs,
        reason: clarification
          ? "Demo reviewer requested clarification; reanalysis is required."
          : "Demo reviewer explicitly finalized all proposal decisions.",
      });
    }
    if (review.completedAt) {
      await publishReviewedPlan(
        tx,
        session.datasetId,
        session.patientId,
        review.id,
      );
    }
    return review;
  });
}

/**
 * Opening a current, reviewable workspace moves MEDICAL_REVIEW_PENDING to
 * MEDICAL_REVIEW_IN_PROGRESS. Idempotent: any other state, a stale or blocked
 * analysis, or a missing scoped patient leaves the workflow unchanged.
 */
export async function openReview(
  db: PrismaClient,
  session: Pick<DemoSession, "datasetId" | "patientId"> | null,
  id: string,
) {
  if (!session) return false;
  z.string().min(1).max(512).parse(id);
  return inDatasetTransaction(db, session.datasetId, async (repository, tx) => {
    let state;
    try {
      // The canonical workflow reader acquires the patient lock before version reads.
      state = await getWorkflowState(tx, session.datasetId, session.patientId);
    } catch (error) {
      // A demo case replacement can remove the cookie's patient; open nothing then.
      const patients = await repository.list("patient").catch(() => null);
      if (patients?.some((patient) => patient.id === session.patientId) ?? true)
        throw error;
      return false;
    }
    const { status, lastTransition } = state;
    if (status !== "MEDICAL_REVIEW_PENDING") return false;
    const [patients, profiles, examinations, analyses, contexts, reviews] =
      await Promise.all([
        repository.list("patient"),
        repository.list("profile"),
        repository.list("examination"),
        repository.list("analysis"),
        repository.list("context"),
        repository.list("review"),
      ]);
    const workspace = findWorkspace(
      { patients, profiles, examinations, analyses, contexts, reviews },
      session.patientId,
      id,
    );
    if (
      !workspace ||
      workspace.stale ||
      workspace.analysis.status !== "PRELIMINARY" ||
      !workspace.analysis.proposals.length ||
      lastTransition?.refs?.analysisId !== workspace.analysis.id
    )
      return false;
    const refs = {
      profileVersion: workspace.profile.version,
      analysisId: workspace.analysis.id,
    };
    await transitionWorkflow(tx, session.datasetId, {
      patientId: session.patientId,
      expectedFrom: status,
      expectedRefs: refs,
      to: "MEDICAL_REVIEW_IN_PROGRESS",
      actor: "demo-physician",
      reason: "Demo reviewer opened the review workspace.",
      refs,
    });
    return true;
  });
}

/** Stored URLs alone cannot establish a supported demonstrative rule/source mapping. */
function validateReviewReferences({ context, analysis }: ReviewWorkspace) {
  const canonical = loadClinicalContext(context.scenarioId, context.version);
  if (!isDeepStrictEqual(context, clinicalContextSchema.parse(canonical)))
    throw new Error(
      "Review requires the supported demonstrative evidence context.",
    );
  for (const proposal of analysis.proposals) {
    const rules = canonical.rules.filter((rule) =>
      proposal.ruleIds.includes(rule.id),
    );
    const allowedEvidence = new Set(rules.flatMap((rule) => rule.evidenceIds));
    if (
      !rules.length ||
      rules.length !== proposal.ruleIds.length ||
      rules.some((rule) => rule.category !== proposal.category) ||
      proposal.evidenceIds.some((id) => !allowedEvidence.has(id)) ||
      [...allowedEvidence].some((id) => !proposal.evidenceIds.includes(id))
    ) {
      throw new Error(
        "Unsupported proposal category or rule/evidence mapping.",
      );
    }
  }
}
