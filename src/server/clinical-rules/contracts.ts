import "server-only";
import { z } from "zod";
import {
  clinicalContextSchema,
  healthProfileSchema,
  previousExaminationSchema,
} from "../../features/patients/contracts";

export const DEMONSTRATIVE_LABEL = "DEMONSTRATIVE — NOT CLINICALLY VALIDATED";
const triState = z.boolean().nullable();
export const screeningFactsSchema = z.object({
  provenance: z.literal("PATIENT_REPORTED"),
  symptoms: triState,
  personalRiskHistory: triState,
  familyRiskHistory: triState,
  familyCrc: triState.optional(),
  familySyndrome: triState.optional(),
  familyCrcFirstDegree: triState.optional(),
  familyCrcDiagnosisAge: z.number().int().min(0).max(120).nullable().optional(),
  priorScreening: z.enum(["NEVER_SCREENED", "COLONOSCOPY", "OTHER"]).nullable(),
  normal: triState,
  complete: triState,
  adequatePreparation: triState,
});
export const screeningInputSchema = z.object({
  synthetic: z.literal(true),
  scenarioId: z.string(),
  contextVersion: z.number().int().positive(),
  asOf: z.iso.date(),
  profile: healthProfileSchema,
  examinations: z.array(previousExaminationSchema),
  facts: screeningFactsSchema,
});
export const ruleSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().positive(),
  validation: z.literal("demonstrative"),
  category: z.enum(["PREVENTIVE_OPPORTUNITY", "POSSIBLE_REDUNDANCY"]),
  evidenceIds: z.array(z.string()).min(1),
  evidenceVersion: z.literal(1),
  minAge: z.union([z.literal(45), z.literal(40)]),
  maxAge: z.literal(75),
  intervalYears: z.union([z.literal(10), z.literal(5)]),
  relativeDiagnosisBeforeAge: z.literal(60).optional(),
  yearsBeforeDiagnosis: z.literal(10).optional(),
});
export const demoContextSchema = clinicalContextSchema.extend({
  validation: z.literal("demonstrative"),
  label: z.literal(DEMONSTRATIVE_LABEL),
  evidence: z.array(
    clinicalContextSchema.shape.evidence.element.extend({
      issuer: z.string().min(1),
      year: z.number().int().positive(),
      accessedAt: z.iso.date(),
      evidenceStatus: z.enum(["public_source", "placeholder"]),
      validation: z.literal("demonstrative"),
      medicallyReviewed: z.literal(false),
    }),
  ),
  rules: z.array(ruleSchema),
});
export type ScreeningInput = z.infer<typeof screeningInputSchema>;
export type DemoContext = z.infer<typeof demoContextSchema>;
export type DemoRule = z.infer<typeof ruleSchema>;
export type RuleStatus =
  "READY_FOR_REVIEW" | "NEEDS_CLARIFICATION" | "OUT_OF_SCOPE" | "BLOCKED";
export type RuleResult = {
  validation: "demonstrative";
  label: typeof DEMONSTRATIVE_LABEL;
  provenance: "RULE_GENERATED";
  requiresPhysicianReview: true;
  mayPublish: false;
  profileVersion: number | null;
  contextVersion: number | null;
  status: RuleStatus;
  reason: string;
  missingFields: string[];
  consideredData: string[];
  limitations: string[];
  findings: {
    category: DemoRule["category"];
    ruleId: string;
    ruleVersion: number;
    evidenceIds: string[];
    evidenceVersion: number;
    rationale: string;
  }[];
};
