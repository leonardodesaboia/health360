import type {
  AIAnalysis,
  IntakeResponse,
  MedicalReview,
  PreventivePlan,
  TimelineEvent,
} from "../patients/contracts";
import { demoProfile } from "../patients/fixtures";
import type { HistoryRecords } from "./history";

/** Synthetic metadata only. No clinical advice or validation. */
export function historyFixture(): {
  patientId: string;
  records: HistoryRecords;
} {
  const profile = structuredClone(demoProfile);
  const patientId = profile.patientId;
  const now = "2026-10-23T12:00:00Z";
  const intake: IntakeResponse = {
    id: "intake-1",
    patientId,
    profileVersion: 1,
    answers: {},
    completedAt: now,
  };
  const analysis: AIAnalysis = {
    id: "analysis-1",
    patientId,
    version: 1,
    profileVersion: 1,
    contextId: "context",
    contextVersion: 1,
    createdAt: now,
    status: "PRELIMINARY",
    provider: "mock",
    model: "mock",
    promptVersion: 1,
    summary: "Demonstrative metadata",
    relevantInformation: [],
    missingInformation: [],
    uncertainties: [],
    reviewQuestions: [],
    proposals: [],
  };
  const review: MedicalReview = {
    id: "review-1",
    patientId,
    version: 1,
    analysisId: analysis.id,
    analysisVersion: 1,
    reviewerId: "demo-reviewer",
    completedAt: now,
    decisions: [],
  };
  const plan: PreventivePlan = {
    id: "plan-1",
    patientId,
    version: 1,
    reviewId: review.id,
    reviewVersion: 1,
    profileVersion: 1,
    publishedAt: now,
    previousPlanId: null,
    actions: [],
    reviewedRedundancies: [],
    pendingInformation: [],
  };
  const events: TimelineEvent[] = [
    {
      kind: "PLAN_PUBLISHED",
      entityId: plan.id,
      entityVersion: 1,
      provenance: "PHYSICIAN_REVIEWED",
    },
    {
      kind: "REVIEW_COMPLETED",
      entityId: review.id,
      entityVersion: 1,
      provenance: "PHYSICIAN_REVIEWED",
    },
    {
      kind: "ANALYSIS_CREATED",
      entityId: analysis.id,
      entityVersion: 1,
      provenance: "AI_GENERATED",
    },
    {
      kind: "INTAKE_COMPLETED",
      entityId: intake.id,
      entityVersion: 1,
      provenance: "PATIENT_REPORTED",
    },
    {
      kind: "PROFILE_UPDATED",
      entityId: profile.id,
      entityVersion: 1,
      provenance: "PATIENT_REPORTED",
    },
  ].map(
    (e, i) =>
      ({
        ...e,
        id: `event-${i}`,
        patientId,
        occurredAt: `2026-10-23T0${5 - i}:00:00Z`,
      }) as TimelineEvent,
  );
  return {
    patientId,
    records: {
      profiles: [profile],
      intakes: [intake],
      analyses: [analysis],
      reviews: [review],
      plans: [plan],
      events,
    },
  };
}
