import "server-only";
import { z } from "zod";
import type {
  Patient,
  HealthProfile,
  PreviousExamination,
} from "../../features/patients/contracts";
import {
  screeningInputSchema,
  type DemoContext,
} from "../clinical-rules/contracts";
import { demoScenarios } from "../clinical-rules/scenarios";

// Demonstration navigation state only. A demo session is never an identity or authorization.
export const demoCaseIds = [
  "daniel-pitch",
  "first-screening",
  "repeat-screening",
] as const;
export const demoCaseIdSchema = z.enum(demoCaseIds);
export type DemoCaseId = z.infer<typeof demoCaseIdSchema>;

// Opaque random token (32 bytes, base64url) held in an httpOnly cookie.
export const demoSessionCookie = "h360_demo_session";
export const demoSessionTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "Invalid demo session token");

export type StoredDemoCase = {
  clinicalContext: DemoContext;
  caseId: DemoCaseId;
  patient: Patient;
  profile: HealthProfile;
  examinations: PreviousExamination[];
};

export type DemoSession = StoredDemoCase & {
  /** Storage scope for every record of this browser's demo case. */
  datasetId: string;
  caseId: DemoCaseId;
  patientId: string;
};

export const demoCaseLabels: Record<
  DemoCaseId,
  { displayName: string; summary: string }
> = {
  "daniel-pitch": {
    displayName: "Daniel",
    summary:
      "Pitch Case, age 40 · Healthy, never smoked · Father had colorectal cancer at age 50",
  },
  "first-screening": {
    displayName: "Alex Example",
    summary: "Synthetic, age 50 · No previous colorectal screening reported",
  },
  "repeat-screening": {
    displayName: "Jordan Example",
    summary: "Synthetic, age 60 · Reports a normal colonoscopy on Nov 3, 2022",
  },
};

export function scenarioFor(caseId: DemoCaseId) {
  if (caseId === "daniel-pitch") {
    const patientId = "synthetic-daniel-pitch";
    return {
      id: "daniel-pitch" as const,
      synthetic: true as const,
      validation: "demonstrative" as const,
      expectedCategory: "PREVENTIVE_OPPORTUNITY" as const,
      input: screeningInputSchema.parse({
        synthetic: true,
        scenarioId: "daniel-pitch",
        contextVersion: 1,
        asOf: "2026-11-03",
        profile: {
          id: "profile-daniel-pitch",
          patientId,
          version: 1,
          age: 40,
          personalHistory: [
            {
              value:
                "Healthy, asymptomatic · Prior unindicated check-up chest CT showed benign pulmonary nodule",
              provenance: "PATIENT_REPORTED",
            },
          ],
          familyHistory: [
            {
              value:
                "First-degree relative (father) diagnosed with colorectal cancer at age 50",
              provenance: "PATIENT_REPORTED",
            },
          ],
          medications: [{ value: "None", provenance: "PATIENT_REPORTED" }],
          habits: [
            {
              value: "Never smoked · Regular physical activity",
              provenance: "PATIENT_REPORTED",
            },
          ],
          missingInformation: [],
          examinationIds: ["synthetic-daniel-chest-ct"],
          updatedAt: "2026-10-22T12:00:00Z",
        },
        examinations: [
          {
            id: "synthetic-daniel-chest-ct",
            patientId,
            name: "Routine Check-up Chest CT (Unindicated)",
            performedAt: "2026-09-15",
            result: {
              value: "Benign pulmonary nodule (incidental false-positive)",
              provenance: "PATIENT_REPORTED",
            },
            notes:
              "Ordered in an unindicated comprehensive check-up despite patient being 40 years old and a never-smoker; triggered weeks of unnecessary anxiety and follow-up.",
          },
        ],
        facts: {
          provenance: "PATIENT_REPORTED",
          symptoms: false,
          personalRiskHistory: false,
          familyRiskHistory: true,
          priorScreening: "NEVER_SCREENED",
          normal: null,
          complete: null,
          adequatePreparation: null,
        },
      }),
    };
  }
  const scenario = demoScenarios.find((item) => item.id === caseId);
  if (!scenario) throw new Error("Unsupported synthetic scenario");
  return scenario;
}
