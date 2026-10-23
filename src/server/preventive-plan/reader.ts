import "server-only";
import type { DatasetRepository } from "../db/repository";
import { buildReviewedPlan } from "../../features/preventive-plan/build";
import { getWorkflowStatus } from "../workflow/state";
import { validatePublicationContext } from "./context";

/** Never returns proposal records to the patient UI. */
export async function readPatientPlan(
  repo: DatasetRepository,
  patientId: string,
) {
  const [patients, plans, reviews, analyses, profiles, contexts] =
    await Promise.all([
      repo.list("patient"),
      repo.list("plan"),
      repo.list("review"),
      repo.list("analysis"),
      repo.list("profile"),
      repo.list("context"),
    ]);
  if (!patients.some((p) => p.id === patientId))
    throw new Error("Demo patient unavailable");
  const status = await getWorkflowStatus(repo, patientId);
  const plan = plans
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => b.version - a.version)[0];
  if (!plan) return { status, plan: null };
  const review = reviews.find(
    (r) =>
      r.patientId === patientId &&
      r.id === plan.reviewId &&
      r.version === plan.reviewVersion,
  );
  const analysis =
    review &&
    analyses.find(
      (a) =>
        a.patientId === patientId &&
        a.id === review.analysisId &&
        a.version === review.analysisVersion,
    );
  const profile = profiles.find(
    (p) => p.patientId === patientId && p.version === plan.profileVersion,
  );
  const context =
    analysis &&
    contexts.find(
      (c) =>
        c.id === analysis.contextId && c.version === analysis.contextVersion,
    );
  if (!review || !analysis || !profile || !context)
    return { status, plan: null };
  try {
    validatePublicationContext(context);
    const expected = buildReviewedPlan({
      id: plan.id,
      patientId,
      review,
      analysis,
      profile,
      context,
      status: "MEDICAL_REVIEW_COMPLETED",
      latestAnalysisVersion: analysis.version,
      latestReviewVersion: review.version,
      previousPlan: null,
      publishedAt: plan.publishedAt,
    });
    if (
      JSON.stringify([
        plan.actions,
        plan.reviewedRedundancies,
        plan.pendingInformation,
      ]) !==
      JSON.stringify([
        expected.actions,
        expected.reviewedRedundancies,
        expected.pendingInformation,
      ])
    )
      return { status, plan: null };
  } catch {
    return { status, plan: null };
  }
  const latestProfile = Math.max(
    ...profiles.filter((p) => p.patientId === patientId).map((p) => p.version),
  );
  return {
    status,
    plan,
    previous:
      status !== "PLAN_AVAILABLE" || latestProfile !== plan.profileVersion,
  };
}
