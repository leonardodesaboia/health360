import "server-only";
import { z } from "zod";
import {
  healthProfileSchema,
  recommendationProposalSchema,
} from "../../../features/patients/contracts";

// Identity and entity links never enter the model payload.
const profile = healthProfileSchema.pick({
  age: true,
  personalHistory: true,
  familyHistory: true,
  medications: true,
  habits: true,
  missingInformation: true,
});
const text = z.string().trim().min(1).max(4000);
const category = recommendationProposalSchema.shape.category;
export const analysisInputSchema = z.object({
  synthetic: z.literal(true),
  profileVersion: z.number().int().positive(),
  profile,
  examinations: z
    .array(
      z.object({
        name: text,
        performedAt: z.iso.date().nullable(),
        result: z.object({
          value: text.nullable(),
          provenance: z.literal("PATIENT_REPORTED"),
        }),
      }),
    )
    .max(30)
    .default([]),
  context: z.object({
    version: z.number().int().positive(),
    validation: z.literal("demonstrative"),
    evidence: z
      .array(
        z.object({
          id: text,
          version: z.number().int().positive(),
          title: text,
          issuer: text,
          year: z.number().int().min(1900).max(2200),
          sourceUrl: z.url().nullable(),
          excerpt: text,
          status: z.enum(["supported", "placeholder"]),
        }),
      )
      .max(30),
    allowedProposals: z
      .array(
        z.object({
          ruleId: text,
          category,
          evidenceIds: z.array(text).min(1),
        }),
      )
      .max(30),
  }),
});
export type AnalysisInput = z.input<typeof analysisInputSchema>;
export type ClinicalContextInput = AnalysisInput["context"];

// Required arrays may be empty; required narrative fields may not.
export const analysisOutputSchema = z.strictObject({
  summary: text,
  relevantInformation: z.array(text).max(30),
  missingInformation: z.array(text).max(30),
  uncertainties: z.array(text).max(30),
  reviewQuestions: z.array(text).max(30),
  proposals: z
    .array(
      z.strictObject({
        category,
        title: text,
        rationale: text,
        ruleIds: z.array(text).min(1).max(30),
        evidenceIds: z.array(text).min(1).max(30),
        consideredData: z.array(text).min(1).max(30),
        uncertainties: z.array(text).max(30),
      }),
    )
    .max(30),
});
export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
