import { describe, expect, it } from "vitest";
import { triStateOr, minimizeInput } from "./input";
import { evaluateScreening } from "../clinical-rules/evaluate";
import { loadClinicalContext } from "../clinical-rules/context";
import { scenarioVariant } from "../clinical-rules/scenarios";

describe("analysis input minimization", () => {
  it.each([
    [[false, false], false],
    [[false, null], null],
    [[null, null], null],
    [[true, null], true],
    [[false, true], true],
    [[], null],
  ] as const)("preserves tri-state OR for %j", (values, expected) => {
    expect(triStateOr(values)).toBe(expected);
  });
  it("sends only evaluator output and a minimized summary", () => {
    const input = scenarioVariant("repeat-screening");
    input.profile.personalHistory = [
      { value: "PRIVATE FREE TEXT", provenance: "PATIENT_REPORTED" },
    ];
    input.examinations[0].notes = "PRIVATE EXAM NOTES";
    const rules = evaluateScreening(input);
    const payload = minimizeInput(
      input.profile,
      rules,
      loadClinicalContext(input.scenarioId, 1),
    );
    const serialized = JSON.stringify(payload);
    for (const secret of [
      input.profile.id,
      input.profile.patientId,
      input.examinations[0].id,
      "PRIVATE FREE TEXT",
      "PRIVATE EXAM NOTES",
    ])
      expect(serialized).not.toContain(secret);
    expect(payload.context.allowedProposals).toEqual(
      rules.findings.map((finding) => ({
        ruleId: finding.ruleId,
        category: finding.category,
        evidenceIds: finding.evidenceIds,
      })),
    );
    expect(serialized).toContain("2022-11-03");
    expect(payload.profile.missingInformation).toEqual(rules.missingFields);
  });
});
