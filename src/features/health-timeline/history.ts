import type {
  AIAnalysis,
  HealthProfile,
  IntakeResponse,
  MedicalReview,
  PreventivePlan,
  TimelineEvent,
} from "../patients/contracts";

export type HistoryRecords = {
  profiles: HealthProfile[];
  intakes: IntakeResponse[];
  analyses: AIAnalysis[];
  reviews: MedicalReview[];
  /** Server reader supplies only plans passing P0-11 review/content integrity checks. */
  plans: PreventivePlan[];
  events: TimelineEvent[];
};

const provenanceLabels = {
  PATIENT_REPORTED: "Patient-reported",
  SYSTEM_STRUCTURED: "System-structured",
  RULE_GENERATED: "Rule-generated",
  AI_GENERATED: "AI-generated",
  PHYSICIAN_REVIEWED: "Physician-reviewed",
} as const;

/** Administrative event metadata only; preliminary analysis text never enters this view. */
export function buildPatientHistory(
  records: HistoryRecords,
  patientId: string,
) {
  const profiles = records.profiles.filter((p) => p.patientId === patientId);
  const intakes = records.intakes.filter(
    (i) =>
      i.patientId === patientId &&
      i.completedAt !== null &&
      profiles.some((p) => p.version === i.profileVersion),
  );
  const analyses = records.analyses.filter(
    (a) =>
      a.patientId === patientId &&
      profiles.some((p) => p.version === a.profileVersion),
  );
  const reviews = records.reviews.filter(
    (r) =>
      r.patientId === patientId &&
      r.completedAt !== null &&
      analyses.some(
        (a) => a.id === r.analysisId && a.version === r.analysisVersion,
      ),
  );
  const plans = records.plans.filter(
    (p) =>
      p.patientId === patientId &&
      profiles.some((profile) => profile.version === p.profileVersion) &&
      reviews.some(
        (r) =>
          r.id === p.reviewId &&
          r.version === p.reviewVersion &&
          analyses.some(
            (a) =>
              a.id === r.analysisId &&
              a.version === r.analysisVersion &&
              a.profileVersion === p.profileVersion,
          ),
      ),
  );

  const linked = (event: TimelineEvent) => {
    const matches = (entry: { id: string; version: number }) =>
      entry.id === event.entityId && entry.version === event.entityVersion;
    const kind: string = event.kind;
    switch (kind) {
      case "PROFILE_UPDATED":
      case "REASSESSMENT_REQUESTED":
      case "CLARIFICATION_ANSWERED":
        return profiles.some(matches);
      case "INTAKE_COMPLETED":
        return intakes.some(
          (i) =>
            i.id === event.entityId && i.profileVersion === event.entityVersion,
        );
      case "ANALYSIS_CREATED":
      case "ANALYSIS_FAILED":
      case "CLARIFICATION_REQUESTED":
        return analyses.some(matches);
      case "REVIEW_COMPLETED":
        return reviews.some(matches);
      case "REVIEW_UPDATED":
      case "REVIEW_CLARIFICATION_REQUESTED":
        return records.reviews.some(
          (r) =>
            r.patientId === patientId &&
            matches(r) &&
            analyses.some(
              (a) => a.id === r.analysisId && a.version === r.analysisVersion,
            ),
        );
      case "PLAN_PUBLISHED":
        return plans.some(matches);
      default:
        return false;
    }
  };
  const seen = new Set<string>();
  const events = records.events
    .filter((e) => e.patientId === patientId && linked(e))
    .toSorted(
      (a, b) =>
        Date.parse(a.occurredAt) - Date.parse(b.occurredAt) ||
        a.id.localeCompare(b.id, "en-US"),
    )
    .filter((e) => {
      const key = `${e.kind}:${e.entityId}:${e.entityVersion}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((e) => ({
      id: e.id,
      kind: e.kind,
      occurredAt: e.occurredAt,
      entityId: e.entityId,
      entityVersion: e.entityVersion,
      provenanceLabel: provenanceLabels[e.provenance],
      title: (
        {
          PROFILE_UPDATED:
            e.entityVersion === 1 ? "Profile created" : "Profile updated",
          INTAKE_COMPLETED: "Health intake completed",
          ANALYSIS_CREATED: "Analysis recorded",
          REVIEW_COMPLETED: "Demonstration physician review completed",
          PLAN_PUBLISHED: "Reviewed plan published",
          REVIEW_UPDATED: "Demonstration review updated",
          REVIEW_CLARIFICATION_REQUESTED: "Reviewer requested more information",
          ANALYSIS_FAILED: "Analysis not completed",
          CLARIFICATION_REQUESTED: "More information requested",
          CLARIFICATION_ANSWERED: "Information updated",
          REASSESSMENT_REQUESTED: "Reassessment requested",
        } as Record<string, string>
      )[e.kind],
    }));
  return {
    events,
    plans: plans
      .toSorted((a, b) => b.version - a.version)
      .map((p) => ({
        id: p.id,
        version: p.version,
        publishedAt: p.publishedAt,
        profileVersion: p.profileVersion,
        reviewVersion: p.reviewVersion,
        previousPlanId: p.previousPlanId,
      })),
  };
}
