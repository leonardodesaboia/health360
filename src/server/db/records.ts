import "server-only";
import { z } from "zod";
import {
  patientSchema,
  healthProfileSchema,
  previousExaminationSchema,
  intakeResponseSchema,
  clinicalContextSchema,
  aiAnalysisSchema,
  medicalReviewSchema,
  preventivePlanSchema,
  timelineEventSchema,
} from "../../features/patients/contracts";

export const recordSchemas = {
  patient: patientSchema,
  profile: healthProfileSchema,
  examination: previousExaminationSchema,
  intake: intakeResponseSchema,
  context: clinicalContextSchema,
  analysis: aiAnalysisSchema,
  review: medicalReviewSchema,
  plan: preventivePlanSchema,
  event: timelineEventSchema,
};
export type RecordKind = keyof typeof recordSchemas;
export type Records = { [K in RecordKind]: z.infer<(typeof recordSchemas)[K]> };

export function validateRecord<K extends RecordKind>(
  kind: K,
  value: unknown,
): Records[K];
export function validateRecord(
  kind: string,
  value: unknown,
): Records[RecordKind];
export function validateRecord(
  kind: string,
  value: unknown,
): Records[RecordKind] {
  if (!Object.hasOwn(recordSchemas, kind))
    throw new Error("Unsupported record kind");
  const record = recordSchemas[kind as RecordKind].parse(value);
  if (
    "proposals" in record &&
    record.proposals.some((proposal) => proposal.analysisId !== record.id)
  ) {
    throw new Error("Proposal analysis mismatch");
  }
  return record;
}

// Storage seed only: no medical recommendation, evidence claim or completed review.
export const seedRecords = {
  patient: [
    patientSchema.parse({
      id: "synthetic-patient-01",
      displayName: "Synthetic case 01",
      synthetic: true,
      status: "NOT_STARTED",
    }),
  ],
  examination: [
    previousExaminationSchema.parse({
      id: "synthetic-exam-01",
      patientId: "synthetic-patient-01",
      name: "Patient-reported examination",
      performedAt: null,
      result: { value: null, provenance: "PATIENT_REPORTED" },
      notes:
        "DEMONSTRATIVE — NOT CLINICALLY VALIDATED. Type, date and result are unknown.",
    }),
  ],
  profile: [
    healthProfileSchema.parse({
      id: "synthetic-profile-01",
      patientId: "synthetic-patient-01",
      version: 1,
      age: null,
      personalHistory: [],
      familyHistory: [{ value: null, provenance: "PATIENT_REPORTED" }],
      medications: [],
      habits: [],
      missingInformation: [
        "Age",
        "Family history",
        "Previous examination date and result",
      ],
      examinationIds: ["synthetic-exam-01"],
      updatedAt: "2026-10-22T00:00:00Z",
    }),
  ],
  context: [
    clinicalContextSchema.parse({
      id: "storage-demo-context",
      version: 1,
      scenarioId: "storage-only",
      demonstrative: true,
      evidence: [],
      ruleIds: [],
    }),
  ],
  analysis: [
    aiAnalysisSchema.parse({
      id: "blocked-storage-analysis",
      version: 1,
      patientId: "synthetic-patient-01",
      profileVersion: 1,
      contextId: "storage-demo-context",
      contextVersion: 1,
      provider: "none",
      model: "none",
      promptVersion: 1,
      createdAt: "2026-10-22T00:00:00Z",
      summary:
        "DEMONSTRATIVE — NOT CLINICALLY VALIDATED. Storage fixture only; no analysis performed.",
      relevantInformation: [],
      missingInformation: ["Clinical context"],
      uncertainties: [],
      reviewQuestions: [],
      proposals: [],
      status: "BLOCKED",
    }),
  ],
} as const;
