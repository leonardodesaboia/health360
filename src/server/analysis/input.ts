import "server-only";
import { analysisInputSchema } from "../ai/schemas/analysis";
import type { HealthProfile } from "../../features/patients/contracts";
import type { DemoContext, RuleResult } from "../clinical-rules/contracts";

/** A positive fact dominates; absence of a positive never erases an unknown. */
export function triStateOr(
  values: readonly (boolean | null)[],
): boolean | null {
  if (values.includes(true)) return true;
  return values.length > 0 && values.every((value) => value === false)
    ? false
    : null;
}

/** Use rule-derived facts only: profile free text, identifiers and notes stay local. */
export function minimizeInput(
  profile: HealthProfile,
  rules: RuleResult,
  context: DemoContext,
) {
  const evidenceIds = new Set(
    rules.findings.flatMap((finding) => finding.evidenceIds),
  );
  return analysisInputSchema.parse({
    synthetic: true as const,
    profileVersion: profile.version,
    profile: {
      age: profile.age,
      personalHistory: [
        rules.reason,
        ...rules.findings.map(
          (finding) =>
            `Rule ${finding.ruleId}, version ${finding.ruleVersion}; evidence version ${finding.evidenceVersion}: ${finding.rationale}`,
        ),
        ...rules.consideredData,
        ...rules.limitations,
      ].map((value) => ({ value, provenance: "SYSTEM_STRUCTURED" as const })),
      familyHistory: [],
      medications: [],
      habits: [],
      missingInformation: [...rules.missingFields],
    },
    examinations: [],
    context: {
      version: context.version,
      validation: "demonstrative" as const,
      evidence: context.evidence
        .filter((source) => evidenceIds.has(source.id))
        .map((source) => ({
          id: source.id,
          version: source.version,
          title: source.title,
          issuer: source.issuer,
          year: source.year,
          sourceUrl: source.sourceUrl,
          excerpt: source.title,
          status:
            source.evidenceStatus === "public_source"
              ? ("supported" as const)
              : ("placeholder" as const),
        })),
      allowedProposals: rules.findings.map((finding) => ({
        ruleId: finding.ruleId,
        category: finding.category,
        evidenceIds: [...finding.evidenceIds],
      })),
    },
  });
}
