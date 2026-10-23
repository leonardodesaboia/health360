import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { buildReviewedPlan } from "../../features/preventive-plan/build";
import type { DatasetRepository } from "../db/repository";
import { getWorkflowStatus, transitionWorkflow } from "../workflow/state";
import { validatePublicationContext } from "./context";

/** Call within the producer's serialized dataset transaction after finalization. */
export async function publishReviewedPlan(
  repo: DatasetRepository,
  patientId: string,
  reviewId: string,
) {
  z.string().min(1).parse(patientId);
  z.string().min(1).parse(reviewId);
  const [patients, profiles, analyses, reviews, contexts, plans] =
    await Promise.all([
      repo.list("patient"),
      repo.list("profile"),
      repo.list("analysis"),
      repo.list("review"),
      repo.list("context"),
      repo.list("plan"),
    ]);
  if (!patients.some((p) => p.id === patientId && p.synthetic))
    throw new Error("Demo patient unavailable");
  const ownedProfiles = profiles.filter((p) => p.patientId === patientId);
  const ownedAnalyses = analyses.filter((a) => a.patientId === patientId);
  const ownedReviews = reviews.filter((r) => r.patientId === patientId);
  const ownedPlans = plans.filter((p) => p.patientId === patientId);
  const review = ownedReviews
    .filter((r) => r.id === reviewId)
    .sort((a, b) => b.version - a.version)[0];
  const profile = ownedProfiles.sort((a, b) => b.version - a.version)[0];
  const analysis = ownedAnalyses.sort((a, b) => b.version - a.version)[0];
  const context =
    analysis &&
    contexts
      .filter((c) => c.id === analysis.contextId)
      .sort((a, b) => b.version - a.version)[0];
  if (!review || !profile || !analysis || !context)
    throw new Error("A current finalized review is required");
  const existing = ownedPlans.find(
    (p) => p.reviewId === review.id && p.reviewVersion === review.version,
  );
  // A repeat publication never creates a new plan, even after reassessment starts.
  if (existing) return existing;
  const status = await getWorkflowStatus(repo, patientId);
  validatePublicationContext(context);
  const plan = buildReviewedPlan({
    id: randomUUID(),
    patientId,
    profile,
    analysis,
    review,
    context,
    latestAnalysisVersion: analysis.version,
    latestReviewVersion: Math.max(
      ...ownedReviews
        .filter((r) => r.analysisId === analysis.id)
        .map((r) => r.version),
    ),
    previousPlan: ownedPlans.sort((a, b) => b.version - a.version)[0] ?? null,
    publishedAt: new Date().toISOString(),
    status,
  });
  await repo.append("plan", plan);
  await transitionWorkflow(repo, {
    patientId,
    to: "PLAN_AVAILABLE",
    expectedFrom: "MEDICAL_REVIEW_COMPLETED",
    actor: "SYSTEM",
    refs: {
      planId: plan.id,
      reviewId: review.id,
      analysisId: analysis.id,
      profileVersion: profile.version,
    },
  });
  await repo.append("event", {
    id: randomUUID(),
    patientId,
    occurredAt: plan.publishedAt,
    kind: "PLAN_PUBLISHED",
    entityId: plan.id,
    entityVersion: plan.version,
    provenance: "PHYSICIAN_REVIEWED",
  });
  return plan;
}
