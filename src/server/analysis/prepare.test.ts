import { describe, expect, it, vi } from "vitest";
import { scenarioVariant } from "../clinical-rules/scenarios";
import { evaluateScreening } from "../clinical-rules/evaluate";
import { prepareAnalysis } from "./prepare";

function successfulResponse(input = scenarioVariant("first-screening")) {
  const rules = evaluateScreening(input);
  return {
    status: "NEEDS_REVIEW",
    data: {
      summary: "Synthetic preliminary explanation.",
      relevantInformation: [],
      missingInformation: [],
      uncertainties: [],
      reviewQuestions: [],
      proposals: rules.findings.map((finding) => ({
        category: finding.category,
        title: "Preliminary proposal",
        rationale: finding.rationale,
        ruleIds: [finding.ruleId],
        evidenceIds: finding.evidenceIds,
        consideredData: ["Model-supplied data"],
        uncertainties: [],
      })),
    },
    meta: {
      provider: "mock",
      model: "deterministic-v1",
      promptVersion: 1,
      profileVersion: input.profile.version,
      contextVersion: input.contextVersion,
    },
  };
}
const identity = {
  id: "test-analysis",
  version: 1,
  createdAt: "2026-11-03T12:00:00Z",
  promptId: "test-prompt",
  provider: "mock",
  model: "deterministic-v1",
  promptVersion: 1,
};

describe("preliminary analysis pipeline", () => {
  it.each(["evidence", "category", "rule"])(
    "rejects model changes to Daniel's deterministic %s",
    async (field) => {
      const input = scenarioVariant("family-history-screening");
      const response = successfulResponse(input);
      const proposal = response.data.proposals[0];
      if (field === "evidence") proposal.evidenceIds = ["uspstf-crc-2021"];
      if (field === "category") proposal.category = "POSSIBLE_REDUNDANCY";
      if (field === "rule") proposal.ruleIds = ["crc-screening-due"];
      const result = await prepareAnalysis(
        input,
        identity,
        async () => response,
      );
      expect(result.to).toBe("ANALYSIS_FAILED");
      expect(result.analysis.proposals).toEqual([]);
    },
  );
  it("never calls the model to override Daniel's unknown or syndromic history", async () => {
    for (const patch of [
      { familyCrcFirstDegree: null },
      { familyCrcDiagnosisAge: null },
      { familySyndrome: true },
    ]) {
      const input = scenarioVariant("family-history-screening");
      Object.assign(input.facts, patch);
      const explain = vi.fn();
      const result = await prepareAnalysis(input, identity, explain);
      expect(explain).not.toHaveBeenCalled();
      expect(result.analysis.status).toBe("BLOCKED");
      expect(result.analysis.proposals).toEqual([]);
    }
  });
  it("keeps deterministic considered data and limits despite model omissions", async () => {
    const input = scenarioVariant("first-screening");
    const result = await prepareAnalysis(input, identity, async () =>
      successfulResponse(input),
    );
    expect(result.to).toBe("MEDICAL_REVIEW_PENDING");
    expect(result.analysis.status).toBe("PRELIMINARY");
    expect(result.analysis.proposals[0].consideredData).toEqual(
      evaluateScreening(input).consideredData,
    );
    expect(result.analysis.proposals[0].uncertainties).toEqual(
      expect.arrayContaining(evaluateScreening(input).limitations),
    );
    expect(result.analysis.proposals[0].analysisId).toBe(identity.id);
    expect(result.analysis.summary).toContain("DEMONSTRATIVE");
    expect(result.analysis.failureReason).toBeUndefined();
  });
  it.each(["unknown-age", "new-symptoms"])(
    "never calls the model for %s",
    async (variant) => {
      const explain = vi.fn();
      const result = await prepareAnalysis(
        scenarioVariant("first-screening", variant),
        identity,
        explain,
      );
      expect(explain).not.toHaveBeenCalled();
      expect(result.to).toBe(
        variant === "unknown-age"
          ? "CLARIFICATION_REQUIRED"
          : "ANALYSIS_FAILED",
      );
      expect(result.analysis.proposals).toEqual([]);
      expect(result.analysis.status).toBe("BLOCKED");
    },
  );
  it.each(["timeout", "api_error", "invalid_output", "unsupported_evidence"])(
    "records safe failure for %s",
    async (reason) => {
      const result = await prepareAnalysis(
        scenarioVariant("first-screening"),
        identity,
        async () => ({ status: "BLOCKED", reason }),
      );
      expect(result.to).toBe("ANALYSIS_FAILED");
      expect(result.analysis.proposals).toEqual([]);
      expect(result.analysis.summary).toContain("Retry");
      expect(result.analysis.failureReason).toBe(reason);
    },
  );
  it("catches provider exceptions without retaining raw error details", async () => {
    const result = await prepareAnalysis(
      scenarioVariant("first-screening"),
      identity,
      async () => {
        throw new Error("SECRET");
      },
    );
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(result.to).toBe("ANALYSIS_FAILED");
  });
  it.each(["profileVersion", "contextVersion"])(
    "rejects a stale adapter %s",
    async (field) => {
      const response = successfulResponse();
      response.meta[field as "profileVersion" | "contextVersion"] = 99;
      const result = await prepareAnalysis(
        scenarioVariant("first-screening"),
        identity,
        async () => response,
      );
      expect(result.to).toBe("ANALYSIS_FAILED");
      expect(result.analysis.proposals).toEqual([]);
    },
  );
  it("rejects malformed successful output", async () => {
    const result = await prepareAnalysis(
      scenarioVariant("first-screening"),
      identity,
      async () => ({
        status: "NEEDS_REVIEW",
        data: { summary: "Nothing else" },
      }),
    );
    expect(result.to).toBe("ANALYSIS_FAILED");
  });
});
