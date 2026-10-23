import {
  aiAnalysisSchema,
  clinicalContextSchema,
} from "../../src/features/patients/contracts";
import {
  demoPatient,
  demoProfile,
  demoExamination,
} from "../../src/features/patients/fixtures";
import type { ReviewRecords } from "../../src/features/clinical-review/reader";

export function readerFixture(): ReviewRecords {
  const analysis = aiAnalysisSchema.parse({
    id: "synthetic-analysis",
    version: 1,
    patientId: demoPatient.id,
    profileVersion: 1,
    contextId: "synthetic-context",
    contextVersion: 1,
    provider: "mock",
    model: "mock",
    promptVersion: 1,
    createdAt: "2026-10-23T12:34:56Z",
    summary: "Demonstrative summary",
    relevantInformation: [],
    missingInformation: ["Family history"],
    uncertainties: ["Patient-reported data"],
    reviewQuestions: [],
    status: "PRELIMINARY",
    proposals: [
      {
        id: "proposal-1",
        analysisId: "synthetic-analysis",
        category: "PREVENTIVE_OPPORTUNITY",
        title: "Demonstrative proposal",
        rationale: "Demonstrative explanation only",
        ruleIds: ["demo-rule"],
        evidenceIds: ["source"],
        consideredData: ["Age reported"],
        uncertainties: ["Not clinically validated"],
        provenance: "AI_GENERATED",
      },
    ],
  });
  return {
    patients: [demoPatient],
    profiles: [demoProfile],
    examinations: [demoExamination],
    analyses: [analysis],
    reviews: [],
    contexts: [
      clinicalContextSchema.parse({
        id: "synthetic-context",
        version: 1,
        scenarioId: "first-screening",
        demonstrative: true,
        ruleIds: ["demo-rule"],
        evidence: [
          {
            id: "source",
            version: 2,
            title: "Test-only placeholder",
            sourceUrl: null,
            medicallyReviewed: false,
          },
        ],
      }),
    ],
  };
}
