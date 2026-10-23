import type { AIAnalysis, MedicalReview } from "../patients/contracts";
import { loadClinicalContext } from "../../server/clinical-rules/context";
import { demoProfile } from "../patients/fixtures";
import type { BuildPlanInput } from "./build";

/** Synthetic demonstrative engineering fixture; no clinical recommendation. */
export function planInput(): BuildPlanInput {
  const patientId = demoProfile.patientId;
  const now = "2026-10-23T12:00:00Z";
  const context = loadClinicalContext("first-screening", 1);
  const analysis: AIAnalysis = {
    id: "analysis",
    version: 1,
    patientId,
    profileVersion: 1,
    contextId: context.id,
    contextVersion: 1,
    provider: "mock",
    model: "mock",
    promptVersion: 1,
    createdAt: now,
    summary: "DEMONSTRATIVE — NOT CLINICALLY VALIDATED",
    relevantInformation: [],
    missingInformation: [],
    uncertainties: [],
    reviewQuestions: [],
    status: "PRELIMINARY",
    proposals: [
      ["action", "PREVENTIVE_OPPORTUNITY", "Reviewed action wording"],
      ["redundancy", "POSSIBLE_REDUNDANCY", "Unmodified proposal"],
      ["information", "CLARIFICATION", "Reviewed information request"],
      ["rejected", "PREVENTIVE_OPPORTUNITY", "Rejected proposal"],
    ].map(([id, category, title]) => ({
      id,
      analysisId: "analysis",
      category: category as AIAnalysis["proposals"][number]["category"],
      title,
      rationale: "Synthetic wording fixture",
      ruleIds: ["crc-screening-due"],
      evidenceIds: ["uspstf-crc-2021"],
      consideredData: [],
      uncertainties: [],
      provenance: "AI_GENERATED",
    })),
  };
  const review: MedicalReview = {
    id: "review",
    version: 1,
    patientId,
    analysisId: analysis.id,
    analysisVersion: 1,
    reviewerId: "demo-reviewer",
    completedAt: now,
    decisions: analysis.proposals.map((p, index) => ({
      proposalId: p.id,
      decision: index === 1 ? "MODIFY" : index === 3 ? "REJECT" : "APPROVE",
      reason: index === 1 || index === 3 ? "Demonstrative decision" : "",
      revisedText: index === 1 ? "Revised redundancy wording" : null,
      recordedAt: now,
    })),
  };
  return {
    id: "plan",
    patientId,
    profile: structuredClone(demoProfile),
    analysis,
    review,
    context,
    latestAnalysisVersion: 1,
    latestReviewVersion: 1,
    previousPlan: null,
    publishedAt: now,
    status: "MEDICAL_REVIEW_COMPLETED",
  };
}
