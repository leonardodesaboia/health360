import { ruleCopy } from "../analysis/rule-copy";
import type { ReviewWorkspace } from "./reader";

/** Presentation only; the server remains authoritative for review permissions. */
export function queueAction(
  workspace: Pick<ReviewWorkspace, "stale" | "workflowStatus"> & {
    analysis: Pick<ReviewWorkspace["analysis"], "status">;
    review: Pick<NonNullable<ReviewWorkspace["review"]>, "completedAt"> | null;
  },
) {
  if (workspace.stale) return "View previous analysis";
  if (workspace.analysis.status === "BLOCKED") return "View blocked analysis";
  if (workspace.review?.completedAt) return "View finalized review";
  if (workspace.workflowStatus === "CLARIFICATION_REQUIRED")
    return "View clarification status";
  if (workspace.workflowStatus === "MEDICAL_REVIEW_IN_PROGRESS")
    return "Continue review";
  if (workspace.workflowStatus === "MEDICAL_REVIEW_PENDING")
    return "Start review";
  return "View analysis status";
}

export const provenanceLabels = {
  PATIENT_REPORTED: "Patient-reported",
  SYSTEM_STRUCTURED: "System-structured",
  RULE_GENERATED: "Rule-generated",
  AI_GENERATED: "AI-generated",
  PHYSICIAN_REVIEWED: "Physician-reviewed",
};

// Match only the known deterministic fact vocabulary; preserve unfamiliar text verbatim.
const consideredLabels: Record<string, string> = {
  Age: "Age",
  symptoms: "Symptoms",
  personalRiskHistory: "Personal risk history",
  familyRiskHistory: "Family risk history",
  familyCrc: "Family history of colorectal cancer",
  familySyndrome:
    "Family history of Lynch syndrome or familial adenomatous polyposis",
  familyCrcFirstDegree: "Affected parent, sibling or child",
  familyCrcDiagnosisAge:
    "Youngest affected first-degree relative's diagnosis age",
  priorScreening: "Previous colorectal screening",
  normal: "Colonoscopy result was normal",
  complete: "Colonoscopy was complete",
  adequatePreparation: "Colonoscopy preparation was adequate",
};
const consideredValues: Record<string, string> = {
  true: "Yes",
  false: "No",
  unknown: "Unknown",
  null: "Unknown",
  NEVER_SCREENED: "Never screened",
  COLONOSCOPY: "Colonoscopy",
  OTHER: "Other screening test",
};
export function readableConsideredData(
  items: string[],
  reportedColonoscopy: boolean,
) {
  const hasColonoscopy =
    reportedColonoscopy || items.includes("priorScreening: COLONOSCOPY");
  return items.flatMap((item) => {
    const separator = item.indexOf(": ");
    if (separator < 0) return [item];
    const key = item.slice(0, separator);
    const value = item.slice(separator + 2);
    if (
      !hasColonoscopy &&
      ["normal", "complete", "adequatePreparation"].includes(key)
    )
      return [];
    if (key === "provenance" && Object.hasOwn(provenanceLabels, value))
      return [provenanceLabels[value as keyof typeof provenanceLabels]];
    return Object.hasOwn(consideredLabels, key)
      ? [
          `${consideredLabels[key]}: ${Object.hasOwn(consideredValues, value) ? consideredValues[value] : value}`,
        ]
      : [item];
  });
}

export function uniqueDemonstrativeLabel(summary: string) {
  let seen = false;
  return summary.replace(
    /DEMONSTRATIVE — NOT CLINICALLY VALIDATED\.?\s*/g,
    (label) => {
      if (seen) return "";
      seen = true;
      return label;
    },
  );
}

export function visibleLimitations(
  items: string[],
  category?: ReviewWorkspace["analysis"]["proposals"][number]["category"],
) {
  return items.filter(
    (item) =>
      category === "POSSIBLE_REDUNDANCY" ||
      !item.startsWith("A recent test alone does not establish redundancy"),
  );
}

/** Use only recorded deterministic rule references, never the AI explanation. */
export function proposalRuleGuidance(
  references: readonly { rationale: string }[],
) {
  return references.map(({ rationale }) => {
    const { proposed, why } = ruleCopy(rationale);
    return { proposed, why };
  });
}
