import "server-only";
import { z } from "zod";
import { analysisInputSchema, type AnalysisOutput } from "../schemas/analysis";
import type { LlmProvider, ProviderRequest, ProviderResult } from "./types";

const label = "DEMONSTRATIVE — NOT CLINICALLY VALIDATED.";
const titles = {
  PREVENTIVE_OPPORTUNITY: "Review supplied prevention finding",
  POSSIBLE_REDUNDANCY: "Review supplied possible redundancy",
  CLARIFICATION: "Review supplied clarification finding",
};

export class MockProvider implements LlmProvider {
  readonly id = "mock";
  constructor(
    private readonly result?: ProviderResult,
    readonly model = "deterministic-v1",
  ) {}
  async generate(request: ProviderRequest): Promise<ProviderResult> {
    if (this.result) return structuredClone(this.result);
    try {
      const input = z
        .object({
          profile: analysisInputSchema.shape.profile,
          context: analysisInputSchema.shape.context,
        })
        .parse(JSON.parse(request.input));
      const proposals: AnalysisOutput["proposals"] = [];
      const seen = new Set<string>();
      for (const allowed of input.context.allowedProposals) {
        const prefix = `Rule ${allowed.ruleId}, version `;
        const records = input.profile.personalHistory.flatMap((item) =>
          item.provenance === "SYSTEM_STRUCTURED" &&
          item.value?.startsWith(prefix)
            ? [item.value]
            : [],
        );
        if (seen.has(allowed.ruleId) || records.length !== 1) {
          return { ok: false, reason: "invalid_output" };
        }
        const record = records[0];
        const match = record
          .slice(prefix.length)
          .match(/^([1-9]\d*); evidence version ([1-9]\d*): (.+)$/s);
        if (
          !match ||
          !Number.isSafeInteger(Number(match[1])) ||
          !Number.isSafeInteger(Number(match[2])) ||
          !match[3].trim() ||
          allowed.evidenceIds.some((id) => {
            const sources = input.context.evidence.filter(
              (source) => source.id === id,
            );
            return (
              sources.length !== 1 || sources[0].version !== Number(match[2])
            );
          })
        ) {
          return { ok: false, reason: "invalid_output" };
        }
        seen.add(allowed.ruleId);
        proposals.push({
          category: allowed.category,
          title: titles[allowed.category],
          rationale: match[3],
          ruleIds: [allowed.ruleId],
          evidenceIds: [...allowed.evidenceIds],
          consideredData: [record],
          uncertainties: [label],
        });
      }
      return {
        ok: true,
        data: {
          summary: "Synthetic demonstration awaiting physician review.",
          relevantInformation: proposals.map((proposal) => proposal.rationale),
          missingInformation: [...input.profile.missingInformation],
          proposals,
          uncertainties: [label],
          reviewQuestions: [
            "Review the supplied facts and missing information.",
          ],
        },
      };
    } catch {
      return { ok: false, reason: "invalid_output" };
    }
  }
}
