import {
  preventivePlanSchema,
  type AIAnalysis,
  type ClinicalContext,
  type HealthProfile,
  type MedicalReview,
  type PreventivePlan,
} from "../patients/contracts";
import { transition, type WorkflowStatus } from "../workflow/workflow";

export type BuildPlanInput = {
  id: string;
  patientId: string;
  profile: HealthProfile;
  analysis: AIAnalysis;
  review: MedicalReview;
  context: ClinicalContext;
  latestAnalysisVersion: number;
  latestReviewVersion: number;
  previousPlan: PreventivePlan | null;
  publishedAt: string;
  status: WorkflowStatus;
};

/** Demonstrative publication guard. A demo reviewer is not medical validation. */
export function buildReviewedPlan(input: BuildPlanInput): PreventivePlan {
  const { patientId, profile, analysis, review, context, previousPlan } = input;
  function denied(): never {
    throw new Error(
      "A current, complete physician review is required to publish a plan.",
    );
  }
  transition(input.status, "PLAN_AVAILABLE");
  if (
    [profile.patientId, analysis.patientId, review.patientId].some(
      (id) => id !== patientId,
    ) ||
    analysis.status !== "PRELIMINARY" ||
    analysis.profileVersion !== profile.version ||
    analysis.version !== input.latestAnalysisVersion ||
    review.version !== input.latestReviewVersion ||
    review.analysisId !== analysis.id ||
    review.analysisVersion !== analysis.version ||
    analysis.contextId !== context.id ||
    analysis.contextVersion !== context.version ||
    !review.completedAt ||
    Date.parse(review.completedAt) > Date.parse(input.publishedAt) ||
    !review.reviewerId.trim() ||
    (previousPlan && previousPlan.patientId !== patientId)
  )
    denied();

  const proposals = new Map(analysis.proposals.map((p) => [p.id, p]));
  const decisions = new Map(review.decisions.map((d) => [d.proposalId, d]));
  if (
    proposals.size !== analysis.proposals.length ||
    decisions.size !== review.decisions.length ||
    decisions.size !== proposals.size
  )
    denied();
  const evidence = new Map(context.evidence.map((e) => [e.id, e]));
  if (evidence.size !== context.evidence.length) denied();

  const actions: PreventivePlan["actions"] = [];
  const reviewedRedundancies: string[] = [];
  const pendingInformation: string[] = [];
  for (const decision of review.decisions) {
    const proposal = proposals.get(decision.proposalId);
    if (
      !proposal ||
      proposal.analysisId !== analysis.id ||
      decision.decision === "PENDING" ||
      decision.decision === "CLARIFY"
    )
      denied();
    if (
      (decision.decision === "MODIFY" || decision.decision === "REJECT") &&
      !decision.reason.trim()
    )
      denied();
    if (Date.parse(decision.recordedAt) > Date.parse(review.completedAt))
      denied();
    if (decision.decision === "REJECT") continue;
    if (
      !proposal.evidenceIds.length ||
      proposal.evidenceIds.some((id) => !evidence.get(id)?.sourceUrl) ||
      !proposal.ruleIds.length ||
      proposal.ruleIds.some((id) => !context.ruleIds.includes(id))
    )
      denied();
    const text =
      decision.decision === "MODIFY"
        ? decision.revisedText?.trim()
        : proposal.title.trim();
    if (!text) denied();
    switch (proposal.category) {
      case "PREVENTIVE_OPPORTUNITY":
        actions.push({ proposalId: proposal.id, text, status: "PENDING" });
        break;
      case "POSSIBLE_REDUNDANCY":
        reviewedRedundancies.push(text);
        break;
      case "CLARIFICATION":
        pendingInformation.push(text);
        break;
    }
  }
  return preventivePlanSchema.parse({
    id: input.id,
    patientId,
    version: (previousPlan?.version ?? 0) + 1,
    reviewId: review.id,
    reviewVersion: review.version,
    profileVersion: profile.version,
    publishedAt: input.publishedAt,
    previousPlanId: previousPlan?.id ?? null,
    actions,
    reviewedRedundancies,
    pendingInformation,
  });
}
