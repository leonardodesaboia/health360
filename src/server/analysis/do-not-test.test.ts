import { describe, expect, it, vi } from "vitest";
import { analyze } from "../ai/analyze";
import { MockProvider } from "../ai/provider/mock";
import type { AnalysisInput } from "../ai/schemas/analysis";
import { evaluateScreening } from "../clinical-rules/evaluate";
import { scenarioVariant } from "../clinical-rules/scenarios";
import { prepareAnalysis } from "./prepare";

const identity = {
  id: "do-not-test-analysis",
  version: 1,
  createdAt: "2026-11-03T12:00:00Z",
  promptId: "synthetic-analysis",
  provider: "mock",
  model: "deterministic-v1",
  promptVersion: 1,
};
const echo = (input: AnalysisInput) => analyze(input, new MockProvider(), 1000);

describe("Do Not Test possible-redundancy proposal", () => {
  it("traces the repeat-screening proposal to the applied rule, data, limits and evidence", async () => {
    const input = scenarioVariant("repeat-screening");
    const rules = evaluateScreening(input);
    const result = await prepareAnalysis(input, identity, echo);

    expect(result.to).toBe("MEDICAL_REVIEW_PENDING");
    expect(result.analysis.status).toBe("PRELIMINARY");
    expect(result.analysis.proposals).toHaveLength(1);
    const [proposal] = result.analysis.proposals;
    expect(proposal).toMatchObject({
      category: "POSSIBLE_REDUNDANCY",
      ruleIds: ["crc-routine-repeat"],
      evidenceIds: rules.findings[0].evidenceIds,
      provenance: "AI_GENERATED",
      ruleReferences: [
        {
          ruleId: "crc-routine-repeat",
          ruleVersion: 1,
          evidenceVersion: 1,
          validation: "demonstrative",
          rationale: rules.findings[0].rationale,
        },
      ],
    });
    expect(proposal.consideredData).toEqual(
      expect.arrayContaining([
        "Age: 60",
        "Examination: Colonoscopy; date: 2022-11-03; result: Normal",
        "normal: true",
        "complete: true",
        "adequatePreparation: true",
      ]),
    );
    expect(proposal.uncertainties).toEqual(
      expect.arrayContaining([
        "A recent test alone does not establish redundancy. Patient-reported examination details require physician verification.",
      ]),
    );
    expect(result.analysis.summary).toContain(
      "Preliminary proposal, awaiting physician review",
    );
  });

  it("does not propose redundancy once the normal colonoscopy reaches the interval", async () => {
    const input = scenarioVariant("repeat-screening");
    input.examinations[0].performedAt = "2015-06-01";
    const result = await prepareAnalysis(input, identity, echo);
    expect(result.to).toBe("MEDICAL_REVIEW_PENDING");
    expect(result.analysis.proposals.map((p) => p.category)).toEqual([
      "PREVENTIVE_OPPORTUNITY",
    ]);
    expect(result.analysis.proposals[0].ruleReferences).toEqual([
      expect.objectContaining({ ruleId: "crc-screening-due", ruleVersion: 1 }),
    ]);
  });

  it("asks for clarification instead of proposing when the examination date is unknown", async () => {
    const explain = vi.fn(echo);
    const result = await prepareAnalysis(
      scenarioVariant("repeat-screening", "unknown-date"),
      identity,
      explain,
    );
    expect(explain).not.toHaveBeenCalled();
    expect(result.to).toBe("CLARIFICATION_REQUIRED");
    expect(result.analysis.proposals).toEqual([]);
    expect(result.analysis.reviewQuestions).toContain(
      "examinations.performedAt",
    );
  });

  it.each([
    ["normal", false],
    ["complete", false],
    ["adequatePreparation", null],
  ] as const)(
    "a recent colonoscopy alone is insufficient when %s is %s",
    async (field, value) => {
      const input = scenarioVariant("repeat-screening");
      input.facts[field] = value;
      const result = await prepareAnalysis(input, identity, echo);
      expect(
        result.analysis.proposals.some(
          (p) => p.category === "POSSIBLE_REDUNDANCY",
        ),
      ).toBe(false);
      expect(result.to).not.toBe("MEDICAL_REVIEW_PENDING");
    },
  );

  it("blocks when the reported colonoscopy record is missing", async () => {
    const input = scenarioVariant("repeat-screening");
    input.examinations = [];
    input.profile.examinationIds = [];
    const result = await prepareAnalysis(input, identity, echo);
    expect(result.to).toBe("ANALYSIS_FAILED");
    expect(result.analysis.proposals).toEqual([]);
  });

  it("rejects model-supplied rule references instead of trusting them", async () => {
    const input = scenarioVariant("repeat-screening");
    const finding = evaluateScreening(input).findings[0];
    const result = await prepareAnalysis(input, identity, async () => ({
      status: "NEEDS_REVIEW",
      data: {
        summary: "Synthetic explanation.",
        relevantInformation: [],
        missingInformation: [],
        uncertainties: [],
        reviewQuestions: [],
        proposals: [
          {
            category: finding.category,
            title: "Possible redundancy",
            rationale: finding.rationale,
            ruleIds: [finding.ruleId],
            evidenceIds: finding.evidenceIds,
            consideredData: ["Model data"],
            uncertainties: [],
            ruleReferences: [{ ruleId: finding.ruleId, ruleVersion: 99 }],
          },
        ],
      },
      meta: {
        provider: "mock",
        model: "deterministic-v1",
        promptVersion: 1,
        profileVersion: input.profile.version,
        contextVersion: input.contextVersion,
      },
    }));
    expect(result.to).toBe("ANALYSIS_FAILED");
    expect(result.analysis.failureReason).toBe("invalid_output");
    expect(result.analysis.proposals).toEqual([]);
  });
});
