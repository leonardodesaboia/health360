import "server-only";
import { z } from "zod";
import { recommendationProposalSchema } from "../../features/patients/contracts";
import type { RuleResult } from "../clinical-rules/contracts";

const proposalsSchema = z.array(
  recommendationProposalSchema.omit({
    id: true,
    analysisId: true,
    provenance: true,
  }),
);

function sameIds(actual: string[], expected: string[]) {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    actual.every((id) => expected.includes(id))
  );
}

/** Schema validity alone never grants clinical scope or publication authority. */
export function validateProposals(raw: unknown, rules: RuleResult): boolean {
  const parsed = proposalsSchema.safeParse(raw);
  if (!parsed.success || rules.status !== "READY_FOR_REVIEW") return false;
  const proposals = parsed.data;
  if (proposals.length !== rules.findings.length || rules.findings.length === 0)
    return false;
  const matched = new Set<string>();
  for (const proposal of proposals) {
    const finding = rules.findings.find(
      (item) =>
        item.category === proposal.category &&
        sameIds(proposal.ruleIds, [item.ruleId]) &&
        sameIds(proposal.evidenceIds, item.evidenceIds),
    );
    if (
      !finding ||
      matched.has(finding.ruleId) ||
      finding.evidenceIds.length === 0
    )
      return false;
    matched.add(finding.ruleId);
  }
  return true;
}
