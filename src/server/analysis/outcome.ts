import "server-only";
import type {
  AIAnalysis,
  HealthProfile,
  PreviousExamination,
  ClinicalContext,
} from "../../features/patients/contracts";
import { analysisOutcome } from "../../features/workflow/outcome";
import { evaluateScreening } from "../clinical-rules/evaluate";
import { mapIntakeFacts } from "./facts";

/** Read-only replay of the existing evaluator with the exact saved analysis versions.
 * No new eligibility rules, provider calls, status changes, or publication. */
export function describeAnalysisOutcome(
  analysis: AIAnalysis,
  profile: HealthProfile,
  examinations: PreviousExamination[],
  context: ClinicalContext,
) {
  if (
    !["out_of_scope", "invalid_input"].includes(analysis.failureReason ?? "") ||
    profile.version !== analysis.profileVersion ||
    context.version !== analysis.contextVersion ||
    context.id !== analysis.contextId
  )
    return analysisOutcome(analysis);
  const rules = evaluateScreening({
    synthetic: true,
    scenarioId: context.scenarioId,
    contextVersion: analysis.contextVersion,
    asOf: analysis.createdAt.slice(0, 10),
    profile,
    examinations,
    facts: mapIntakeFacts(profile.intakeFacts),
  });
  return analysisOutcome({
    ...analysis,
    ruleReason:
      rules.status === "OUT_OF_SCOPE" || rules.status === "BLOCKED"
        ? rules.reason
        : undefined,
  });
}
