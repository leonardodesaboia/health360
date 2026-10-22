import { z } from "zod";
import { workflowStatuses } from "../workflow/workflow";

// Contracts only. Cross-entity version, evidence and authorization checks belong in future services.
const id = z.string().min(1);
const version = z.number().int().positive();
const timestamp = z.iso.datetime();
export const provenanceSchema = z.enum([
  "PATIENT_REPORTED",
  "SYSTEM_STRUCTURED",
  "RULE_GENERATED",
  "AI_GENERATED",
  "PHYSICIAN_REVIEWED",
]);
const sourcedText = z.object({
  value: z.string().nullable(),
  provenance: provenanceSchema,
});
export const patientSchema = z.object({
  id,
  displayName: z.string().min(1),
  synthetic: z.literal(true),
  status: z.enum(workflowStatuses),
});
export const previousExaminationSchema = z.object({
  id,
  patientId: id,
  name: z.string(),
  performedAt: z.iso.date().nullable(),
  result: sourcedText,
  notes: z.string(),
});
export const healthProfileSchema = z.object({
  id,
  patientId: id,
  version,
  age: z.number().int().min(0).max(120).nullable(),
  personalHistory: z.array(sourcedText),
  familyHistory: z.array(sourcedText),
  medications: z.array(sourcedText),
  habits: z.array(sourcedText),
  missingInformation: z.array(z.string()),
  examinationIds: z.array(id),
  updatedAt: timestamp,
});
export const intakeResponseSchema = z.object({
  id,
  patientId: id,
  profileVersion: version,
  answers: z.record(z.string(), sourcedText),
  completedAt: timestamp.nullable(),
});
export const clinicalContextSchema = z.object({
  id,
  version,
  scenarioId: id,
  demonstrative: z.literal(true),
  evidence: z.array(
    z.object({
      id,
      version,
      title: z.string(),
      sourceUrl: z.url().nullable(),
      medicallyReviewed: z.boolean(),
    }),
  ),
  ruleIds: z.array(id),
});
export const recommendationProposalSchema = z.object({
  id,
  analysisId: id,
  category: z.enum([
    "PREVENTIVE_OPPORTUNITY",
    "POSSIBLE_REDUNDANCY",
    "CLARIFICATION",
  ]),
  title: z.string(),
  rationale: z.string(),
  ruleIds: z.array(id),
  evidenceIds: z.array(id),
  consideredData: z.array(z.string()),
  uncertainties: z.array(z.string()),
  provenance: z.literal("AI_GENERATED"),
});
export const aiAnalysisSchema = z.object({
  id,
  version,
  patientId: id,
  profileVersion: version,
  contextId: id,
  contextVersion: version,
  provider: z.string(),
  model: z.string(),
  promptVersion: version,
  createdAt: timestamp,
  summary: z.string(),
  relevantInformation: z.array(z.string()),
  missingInformation: z.array(z.string()),
  uncertainties: z.array(z.string()),
  reviewQuestions: z.array(z.string()),
  proposals: z.array(recommendationProposalSchema),
  status: z.enum(["PRELIMINARY", "BLOCKED"]),
});
export const medicalReviewSchema = z.object({
  id,
  version,
  patientId: id,
  analysisId: id,
  analysisVersion: version,
  reviewerId: id,
  completedAt: timestamp.nullable(),
  decisions: z.array(
    z.object({
      proposalId: id,
      decision: z.enum(["APPROVE", "MODIFY", "REJECT", "PENDING", "CLARIFY"]),
      reason: z.string(),
      revisedText: z.string().nullable(),
      recordedAt: timestamp,
    }),
  ),
});
export const preventivePlanSchema = z.object({
  id,
  patientId: id,
  version,
  reviewId: id,
  reviewVersion: version,
  profileVersion: version,
  publishedAt: timestamp,
  previousPlanId: id.nullable(),
  actions: z.array(
    z.object({
      proposalId: id,
      text: z.string(),
      status: z.enum(["PENDING", "COMPLETED", "DEFERRED"]),
    }),
  ),
  reviewedRedundancies: z.array(z.string()),
  pendingInformation: z.array(z.string()),
});
export const timelineEventSchema = z.object({
  id,
  patientId: id,
  occurredAt: timestamp,
  kind: z.enum([
    "PROFILE_UPDATED",
    "INTAKE_COMPLETED",
    "ANALYSIS_CREATED",
    "REVIEW_COMPLETED",
    "PLAN_PUBLISHED",
  ]),
  entityId: id,
  entityVersion: version,
  provenance: provenanceSchema,
});

export type Patient = z.infer<typeof patientSchema>;
export type HealthProfile = z.infer<typeof healthProfileSchema>;
export type IntakeResponse = z.infer<typeof intakeResponseSchema>;
export type PreviousExamination = z.infer<typeof previousExaminationSchema>;
export type ClinicalContext = z.infer<typeof clinicalContextSchema>;
export type AIAnalysis = z.infer<typeof aiAnalysisSchema>;
export type RecommendationProposal = z.infer<
  typeof recommendationProposalSchema
>;
export type MedicalReview = z.infer<typeof medicalReviewSchema>;
export type PreventivePlan = z.infer<typeof preventivePlanSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
