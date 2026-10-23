import "server-only";
import {
  screeningInputSchema,
  type ScreeningInput,
  type RuleStatus,
} from "./contracts";

function preparedInput(
  id: string,
  age: number,
  repeat: boolean,
): ScreeningInput {
  const patientId = `synthetic-${id}`;
  return screeningInputSchema.parse({
    synthetic: true,
    scenarioId: id,
    contextVersion: 1,
    asOf: "2026-11-03",
    profile: {
      id: `profile-${id}`,
      patientId,
      version: 1,
      age,
      personalHistory: [
        {
          value: "No listed colorectal risk history",
          provenance: "PATIENT_REPORTED",
        },
      ],
      familyHistory: [
        {
          value: "No listed family risk history",
          provenance: "PATIENT_REPORTED",
        },
      ],
      medications: [{ value: null, provenance: "PATIENT_REPORTED" }],
      habits: [{ value: null, provenance: "PATIENT_REPORTED" }],
      missingInformation: [],
      examinationIds: repeat ? ["synthetic-colonoscopy"] : [],
      updatedAt: "2026-10-22T12:00:00Z",
    },
    examinations: repeat
      ? [
          {
            id: "synthetic-colonoscopy",
            patientId,
            name: "Colonoscopy",
            performedAt: "2022-11-03",
            result: { value: "Normal", provenance: "PATIENT_REPORTED" },
            notes:
              "Synthetic report: complete to cecum; preparation adequate to detect lesions over 5 mm.",
          },
        ]
      : [],
    facts: {
      provenance: "PATIENT_REPORTED",
      symptoms: false,
      personalRiskHistory: false,
      familyRiskHistory: false,
      priorScreening: repeat ? "COLONOSCOPY" : "NEVER_SCREENED",
      normal: repeat ? true : null,
      complete: repeat ? true : null,
      adequatePreparation: repeat ? true : null,
    },
  });
}

export const demoScenarios = [
  {
    id: "first-screening",
    synthetic: true,
    validation: "demonstrative",
    input: preparedInput("first-screening", 50, false),
    expectedCategory: "PREVENTIVE_OPPORTUNITY",
  },
  {
    id: "repeat-screening",
    synthetic: true,
    validation: "demonstrative",
    input: preparedInput("repeat-screening", 60, true),
    expectedCategory: "POSSIBLE_REDUNDANCY",
  },
] as const;

export function scenarioVariant(
  scenarioId: string,
  variant = "baseline",
): ScreeningInput {
  const scenario = demoScenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error("Unsupported synthetic scenario");
  const input = structuredClone(scenario.input);
  if (variant === "unknown-date") input.examinations[0].performedAt = null;
  else if (variant === "unknown-age") input.profile.age = null;
  else if (variant === "new-symptoms") {
    input.facts.symptoms = true;
    input.profile.version = 2;
    input.profile.updatedAt = "2026-11-03T12:00:00Z";
  } else if (variant !== "baseline")
    throw new Error("Unsupported scenario variant");
  return input;
}

/** Expectations for future orchestration tests, not proof that persisted flows exist. */
export const flowExpectations = demoScenarios.flatMap((scenario) =>
  (["A", "B", "C", "D", "E"] as const).map((flow) => ({
    scenarioId: scenario.id,
    synthetic: true,
    validation: "demonstrative",
    flow,
    variant:
      flow === "C"
        ? scenario.id === "repeat-screening"
          ? "unknown-date"
          : "unknown-age"
        : flow === "D"
          ? "new-symptoms"
          : "baseline",
    ruleStatus: (flow === "C"
      ? "NEEDS_CLARIFICATION"
      : flow === "D"
        ? "OUT_OF_SCOPE"
        : "READY_FOR_REVIEW") as RuleStatus,
    categories: flow === "D" || flow === "C" ? [] : [scenario.expectedCategory],
    downstreamStatus:
      flow === "E"
        ? "ANALYSIS_FAILED"
        : flow === "D"
          ? "REASSESSMENT_PENDING"
          : flow === "C"
            ? "CLARIFICATION_REQUIRED"
            : "MEDICAL_REVIEW_PENDING",
    preservePriorPlan: flow === "D",
    publicationRequiresFinalizedReview: true,
  })),
);
