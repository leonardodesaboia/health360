import type { AIAnalysis } from "../patients/contracts";

export type AnalysisOutcome = Readonly<{
  kind: "out-of-scope" | "blocked" | "clarification" | "provider-failure";
  heading: string;
  explanation: string;
  provenance: string;
}>;

/** Presentation of saved rule facts only. Never evaluates eligibility or exposes AI text. */
export function analysisOutcome(
  analysis: Pick<
    AIAnalysis,
    "status" | "failureReason" | "relevantInformation"
  > & { ruleReason?: string },
): AnalysisOutcome | null {
  if (analysis.status !== "BLOCKED") return null;
  const reason = analysis.failureReason;
  if (reason === "missing_information")
    return {
      kind: "clarification",
      heading: "More information is needed",
      explanation:
        "Required information is missing or unknown. Answer the requested questions before analysis can continue.",
      provenance: "Rule-generated from patient-reported information",
    };
  if (reason === "out_of_scope") {
    const facts = analysis.relevantInformation;
    const has = (value: string) => facts.includes(value);
    const explanations: string[] = [];
    if (has("symptoms: true"))
      explanations.push(
        "Symptoms were reported. This screening demonstration does not apply when symptoms are reported. Symptoms need assessment by a clinician.",
      );
    if (has("personalRiskHistory: true"))
      explanations.push(
        "Personal risk history was reported and is outside this screening demonstration's criteria.",
      );
    if (has("familySyndrome: true"))
      explanations.push(
        "A family history of Lynch syndrome or familial adenomatous polyposis was reported and is outside this screening demonstration's criteria.",
      );
    if (has("priorScreening: OTHER"))
      explanations.push(
        "Another prior screening test was reported. This demonstration does not cover that test history.",
      );
    if (
      ["normal: false", "complete: false", "adequatePreparation: false"].some(
        has,
      )
    )
      explanations.push(
        "The reported examination details fall outside this demonstration's normal, complete, adequately prepared colonoscopy criteria.",
      );
    if (
      !explanations.length &&
      analysis.ruleReason === "Age is outside demonstration criteria"
    )
      explanations.push(
        "The reported age is outside this demonstration's age criteria.",
      );
    if (
      !explanations.length &&
      analysis.ruleReason === "Family history is outside demonstration criteria"
    )
      explanations.push(
        "The reported family history does not meet this demonstration's restricted family-history criteria.",
      );
    if (
      !explanations.length &&
      analysis.ruleReason ===
        "Prior screening is outside family-history criteria"
    )
      explanations.push(
        "Prior screening was reported. This family-history demonstration covers only never-screened cases.",
      );
    // Legacy records do not retain individual exclusion codes. Do not reconstruct age thresholds.
    if (!explanations.length)
      explanations.push(
        "This demonstration's screening criteria do not apply to the recorded information. The specific exclusion reason is unavailable in this record.",
      );
    return {
      kind: "out-of-scope",
      heading: "Outside this screening demonstration",
      explanation:
        explanations.join(" ") +
        " Update your information if an answer was entered by mistake.",
      provenance: "Rule-generated from patient-reported information",
    };
  }
  if (
    reason &&
    [
      "configuration",
      "timeout",
      "api_error",
      "refused",
      "invalid_output",
      "unsupported_evidence",
      "unsupported_scope",
    ].includes(reason)
  )
    return {
      kind: "provider-failure",
      heading: "Retry the analysis",
      explanation:
        "This attempt did not produce reviewable proposals. Retry with your saved information. A successful analysis still requires physician review.",
      provenance: "System-generated analysis status",
    };
  const blockedReasons: Record<string, string> = {
    "Invalid screening input":
      "The saved screening information could not be read in the required format.",
    "Unsupported scenario or context version":
      "The saved scenario or context version is not supported by this demonstration.",
    "Missing or unsupported evidence":
      "The rule evidence is missing or unsupported. This result cannot be published.",
    "Profile timestamp is later than the evaluation date":
      "The saved profile date is later than the analysis date, so the information could not be verified.",
    "Unlinked, duplicate, cross-patient or future examination":
      "The saved examination links or dates could not be verified for this profile.",
    "Screening history contradicts examination facts":
      "The reported screening history conflicts with the saved examination information.",
    "Missing family-history rule parameters":
      "Required family-history rule settings are missing from this demonstration context.",
    "The restricted rule requires exactly one linked colonoscopy":
      "This demonstration requires one linked colonoscopy record; the saved examination history does not match that requirement.",
    "Examination result contradicts or exceeds the restricted normal-result vocabulary":
      "The reported examination result does not match the normal-result information required by this demonstration.",
  };
  return {
    kind: "blocked",
    heading: "Analysis is blocked",
    explanation:
      (analysis.ruleReason ? blockedReasons[analysis.ruleReason] : undefined) ??
      "The saved information or analysis context could not be verified for this demonstration. Review and update your information before another analysis. No proposals can be reviewed or published.",
    provenance: "System-generated status and rule-generated context",
  };
}
