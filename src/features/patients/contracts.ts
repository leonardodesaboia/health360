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
  datePrecision: z.enum(["EXACT", "APPROXIMATE", "UNKNOWN"]).optional(),
  approximateDate: z
    .string()
    .regex(/^\d{4}(-(?:0[1-9]|1[0-2]))?$/)
    .nullable()
    .optional(),
  result: sourcedText,
  notes: z.string(),
});
export const intakeFactsSchema = z.object({
  provenance: z.literal("PATIENT_REPORTED"),
  rectalBleeding: z.boolean().nullable(),
  bowelChange: z.boolean().nullable(),
  weightLoss: z.boolean().nullable(),
  colorectalCancer: z.boolean().nullable(),
  polyps: z.boolean().nullable(),
  ibd: z.boolean().nullable(),
  hereditaryCancerSyndrome: z.boolean().nullable(),
  serratedPolyposis: z.boolean().nullable(),
  familyCrc: z.boolean().nullable(),
  familySyndrome: z.boolean().nullable(),
  colonoscopyNormal: z.boolean().nullable(),
  colonoscopyComplete: z.boolean().nullable(),
  colonoscopyAdequatePrep: z.boolean().nullable(),
  priorScreening: z.enum(["NEVER_SCREENED", "COLONOSCOPY", "OTHER"]).nullable(),
});
export const healthProfileSchema = z.object({
  id,
  patientId: id,
  version,
  age: z.number().int().min(0).max(120).nullable(),
  intakeFacts: intakeFactsSchema.optional(),
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
  // Server-stamped from deterministic rule findings, never from model output.
  ruleReferences: z
    .array(
      z.object({
        ruleId: id,
        ruleVersion: version,
        evidenceVersion: version,
        validation: z.literal("demonstrative"),
        rationale: z.string().min(1),
      }),
    )
    .min(1)
    .optional(),
});
export const analysisFailureReasonSchema = z.enum([
  "configuration",
  "invalid_input",
  "timeout",
  "api_error",
  "refused",
  "invalid_output",
  "unsupported_evidence",
  "unsupported_scope",
  "missing_information",
  "out_of_scope",
  "stale_input",
  "unsupported_context",
]);
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
  promptId: z.string().min(1).optional(),
  failureReason: analysisFailureReasonSchema.optional(),
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
      // Typed physician clarification request (CLARIFY only); targetField is an intake FieldId.
      clarification: z
        .object({
          question: z.string().min(1).max(500),
          targetField: z.string().min(1).max(80).optional(),
        })
        .strict()
        .nullable()
        .optional(),
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
    "REVIEW_UPDATED",
    "REVIEW_CLARIFICATION_REQUESTED",
    "ANALYSIS_FAILED",
    "CLARIFICATION_REQUESTED",
    "CLARIFICATION_ANSWERED",
    "REASSESSMENT_REQUESTED",
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
