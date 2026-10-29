import { describe, expect, it } from "vitest";
import { analyze } from "../analyze";
import type { AnalysisInput } from "../schemas/analysis";
import { MockProvider } from "./mock";

const label = "DEMONSTRATIVE — NOT CLINICALLY VALIDATED.";
const rationale = "Explain the supplied synthetic deterministic finding.";
const record = `Rule demo-rule, version 2; evidence version 1: ${rationale}`;
const input: AnalysisInput = {
  synthetic: true,
  profileVersion: 3,
  profile: {
    age: null,
    personalHistory: [{ value: record, provenance: "SYSTEM_STRUCTURED" }],
    familyHistory: [],
    medications: [],
    habits: [],
    missingInformation: ["age"],
  },
  context: {
    version: 4,
    validation: "demonstrative",
    evidence: [
      {
        id: "demo-evidence",
        version: 1,
        title: "Synthetic test evidence",
        issuer: "Test fixture",
        year: 2026,
        sourceUrl: "https://example.org/test-only",
        excerpt: "Test-only support.",
        status: "supported",
      },
    ],
    allowedProposals: [
      {
        ruleId: "demo-rule",
        category: "PREVENTIVE_OPPORTUNITY",
        evidenceIds: ["demo-evidence"],
      },
    ],
  },
};
const run = (value: AnalysisInput = input) =>
  analyze(value, new MockProvider(), 100);

describe("default deterministic mock finding explanations", () => {
  it("reproduces the P0-07 required finding with exact supplied scope and rationale", async () => {
    const result = await run();
    expect(result.status).toBe("NEEDS_REVIEW");
    if (result.status !== "NEEDS_REVIEW")
      throw new Error("Expected preliminary findings");
    expect(result.data.proposals).toEqual([
      {
        category: "PREVENTIVE_OPPORTUNITY",
        title: expect.any(String),
        rationale,
        ruleIds: ["demo-rule"],
        evidenceIds: ["demo-evidence"],
        consideredData: [record],
        uncertainties: [label],
      },
    ]);
    expect(result.data.missingInformation).toEqual(["age"]);
    expect(result).toMatchObject({
      validation: "demonstrative",
      provenance: "AI_GENERATED",
    });
  });
  it("covers every supplied category and complete evidence list without expanding scope", async () => {
    const categories = [
      "PREVENTIVE_OPPORTUNITY",
      "POSSIBLE_REDUNDANCY",
      "CLARIFICATION",
    ] as const;
    const request: AnalysisInput = {
      ...input,
      profile: {
        ...input.profile,
        personalHistory: [
          ...categories.map((category, index) => ({
            value: `Rule rule-${index}, version 1; evidence version 1: Supplied ${category} rationale.`,
            provenance: "SYSTEM_STRUCTURED" as const,
          })),
          {
            value:
              "Rule forbidden, version 1; evidence version 1: Do not emit.",
            provenance: "SYSTEM_STRUCTURED",
          },
        ],
      },
      context: {
        ...input.context,
        evidence: [
          ...input.context.evidence,
          { ...input.context.evidence[0], id: "second-source" },
        ],
        allowedProposals: categories.map((category, index) => ({
          ruleId: `rule-${index}`,
          category,
          evidenceIds: ["demo-evidence", "second-source"],
        })),
      },
    };
    const result = await run(request);
    expect(result.status).toBe("NEEDS_REVIEW");
    if (result.status !== "NEEDS_REVIEW")
      throw new Error("Expected preliminary findings");
    expect(
      result.data.proposals.map(({ category, ruleIds, evidenceIds }) => ({
        category,
        ruleIds,
        evidenceIds,
      })),
    ).toEqual(
      categories.map((category, index) => ({
        category,
        ruleIds: [`rule-${index}`],
        evidenceIds: ["demo-evidence", "second-source"],
      })),
    );
  });
  it.each([
    [],
    [{ value: record, provenance: "PATIENT_REPORTED" as const }],
    [
      {
        value: "Rule demo-rule, version invalid: invented",
        provenance: "SYSTEM_STRUCTURED" as const,
      },
    ],
    [
      {
        value: "Rule demo-rule, version 1; evidence version 2: Stale support.",
        provenance: "SYSTEM_STRUCTURED" as const,
      },
    ],
    [
      { value: record, provenance: "SYSTEM_STRUCTURED" as const },
      { value: record, provenance: "SYSTEM_STRUCTURED" as const },
    ],
  ])(
    "blocks missing, untrusted, malformed, stale or ambiguous rationale support",
    async (...history) => {
      // it.each expands each table row: preserve the array of history entries.
      const result = await run({
        ...input,
        profile: { ...input.profile, personalHistory: history },
      });
      expect(result).toEqual({ status: "BLOCKED", reason: "invalid_output" });
    },
  );
  it("keeps empty scope empty even when history contains a finding", async () => {
    const result = await run({
      ...input,
      context: { ...input.context, allowedProposals: [] },
    });
    expect(result).toMatchObject({
      status: "NEEDS_REVIEW",
      data: { proposals: [], missingInformation: ["age"] },
    });
  });
  it.each(["placeholder", "unknown"] as const)(
    "does not bypass %s evidence validation",
    async (status) => {
      const result = await run({
        ...input,
        context: {
          ...input.context,
          evidence:
            status === "unknown"
              ? []
              : [{ ...input.context.evidence[0], status }],
        },
      });
      expect(result.status).toBe("BLOCKED");
    },
  );
  it.each(["oversized", "duplicate"] as const)(
    "blocks %s findings without a partial result",
    async (kind) => {
      const request: AnalysisInput =
        kind === "oversized"
          ? {
              ...input,
              profile: {
                ...input.profile,
                personalHistory: [
                  {
                    value:
                      "Rule demo-rule, version 1; evidence version 1: " +
                      "x".repeat(4001),
                    provenance: "SYSTEM_STRUCTURED",
                  },
                ],
              },
            }
          : {
              ...input,
              context: {
                ...input.context,
                allowedProposals: [
                  ...input.context.allowedProposals,
                  ...input.context.allowedProposals,
                ],
              },
            };
      expect(await run(request)).toEqual({
        status: "BLOCKED",
        reason: "invalid_output",
      });
    },
  );
  it("is repeatable and leaves the source request unchanged", async () => {
    const before = structuredClone(input);
    expect(await run()).toEqual(await run());
    expect(input).toEqual(before);
  });
});

describe("specific rule-derived mock copy", () => {
  it.each([
    [
      "crc-screening-due",
      "Discuss age-appropriate colorectal screening options; no prior screening is reported.",
      "Discuss age-appropriate colorectal screening options",
    ],
    [
      "crc-routine-repeat",
      "A routine repeat colonoscopy may be redundant within the ten-year interval after a reported normal complete adequately prepared examination; verify the report and indication.",
      "A routine repeat colonoscopy may be redundant",
    ],
    [
      "crc-family-history-early-start",
      "Discuss starting colorectal screening by colonoscopy now because a parent, sibling or child was diagnosed with colorectal cancer at age 50. Verify the family history.",
      "Discuss starting colorectal screening by colonoscopy now",
    ],
  ])(
    "describes %s using only the supplied rationale",
    async (ruleId, supplied, title) => {
      const value = structuredClone(input);
      value.context.allowedProposals[0].ruleId = ruleId;
      value.profile.personalHistory = [
        {
          value: `Rule ${ruleId}, version 1; evidence version 1: ${supplied}`,
          provenance: "SYSTEM_STRUCTURED",
        },
      ];
      const result = await run(value);
      expect(result.status).toBe("NEEDS_REVIEW");
      if (result.status !== "NEEDS_REVIEW")
        throw new Error("Expected validated mock output");
      expect(result.data.proposals[0]).toMatchObject({
        title,
        rationale: supplied,
        ruleIds: [ruleId],
        category: "PREVENTIVE_OPPORTUNITY",
        evidenceIds: ["demo-evidence"],
      });
      expect(result.data.summary).toBe(
        `Deterministic mock explanation, awaiting physician review. ${supplied.split(/(?<=[.!?])\s+/)[0]}`,
      );
      expect(result.meta).toMatchObject({
        provider: "mock",
        model: "deterministic-v1",
      });
    },
  );
});
