import { describe, expect, it } from "vitest";
import { evaluateScreening } from "../clinical-rules/evaluate";
import { scenarioVariant } from "../clinical-rules/scenarios";
import { validateProposals } from "./validate";

function fixture() {
  const rules = evaluateScreening(scenarioVariant("first-screening"));
  const finding = rules.findings[0];
  const proposals = [
    {
      category: finding.category,
      title: "Preliminary screening discussion",
      rationale: finding.rationale,
      ruleIds: [finding.ruleId],
      evidenceIds: finding.evidenceIds,
      consideredData: ["Age: 50"],
      uncertainties: [],
    },
  ];
  return { rules, proposals };
}

describe("deterministic proposal integrity", () => {
  it("accepts only the supplied finding", () => {
    const { rules, proposals } = fixture();
    expect(validateProposals(proposals, rules)).toBe(true);
  });
  it.each(["evidenceIds", "ruleIds"] as const)(
    "rejects fabricated %s",
    (field) => {
      const { rules, proposals } = fixture();
      proposals[0][field] = ["fabricated"];
      expect(validateProposals(proposals, rules)).toBe(false);
    },
  );
  it("rejects empty evidence, omissions, duplicates and category expansion", () => {
    const { rules, proposals } = fixture();
    expect(validateProposals([], rules)).toBe(false);
    expect(validateProposals([...proposals, ...proposals], rules)).toBe(false);
    expect(
      validateProposals([{ ...proposals[0], evidenceIds: [] }], rules),
    ).toBe(false);
    expect(
      validateProposals(
        [{ ...proposals[0], category: "CLARIFICATION" }],
        rules,
      ),
    ).toBe(false);
  });
  it.each(["unknown-age", "new-symptoms"])(
    "never permits proposals for %s",
    (variant) => {
      const { proposals } = fixture();
      const rules = evaluateScreening(
        scenarioVariant("first-screening", variant),
      );
      expect(validateProposals(proposals, rules)).toBe(false);
    },
  );
  it("rejects malformed model values", () => {
    const { rules } = fixture();
    for (const value of [null, "{}", [{}], [{ category: "DIAGNOSIS" }]])
      expect(validateProposals(value, rules)).toBe(false);
  });
});
