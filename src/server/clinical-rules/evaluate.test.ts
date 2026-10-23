import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { evaluateScreening } from "./evaluate";
import { loadClinicalContext, evidenceSupportsRule } from "./context";
import { demoScenarios, flowExpectations, scenarioVariant } from "./scenarios";

const evaluate = (variant = "baseline") =>
  evaluateScreening(scenarioVariant("repeat-screening", variant));

describe("demonstrative deterministic screening", () => {
  it.each(demoScenarios)("matches $id baseline", (scenario) => {
    const result = evaluateScreening(scenario.input);
    expect(result.status).toBe("READY_FOR_REVIEW");
    expect(result.findings.map((finding) => finding.category)).toEqual([
      scenario.expectedCategory,
    ]);
    expect(result).toMatchObject({
      validation: "demonstrative",
      provenance: "RULE_GENERATED",
      label: "DEMONSTRATIVE — NOT CLINICALLY VALIDATED",
      requiresPhysicianReview: true,
      mayPublish: false,
      profileVersion: 1,
      contextVersion: 1,
    });
    expect(result.findings[0].ruleVersion).toBe(1);
    expect(result.findings[0].evidenceIds.length).toBeGreaterThan(0);
    expect(result.consideredData.length).toBeGreaterThan(0);
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it.each([44, 76])("excludes age %i", (age) => {
    const input = scenarioVariant("first-screening");
    input.profile.age = age;
    expect(evaluateScreening(input).status).toBe("OUT_OF_SCOPE");
  });
  it.each([45, 75])("includes age %i", (age) => {
    const input = scenarioVariant("first-screening");
    input.profile.age = age;
    expect(evaluateScreening(input).findings[0].category).toBe(
      "PREVENTIVE_OPPORTUNITY",
    );
  });
  it.each(["symptoms", "personalRiskHistory", "familyRiskHistory"] as const)(
    "%s true excludes; null clarifies",
    (field) => {
      const input = scenarioVariant("repeat-screening");
      input.facts[field] = true;
      expect(evaluateScreening(input).status).toBe("OUT_OF_SCOPE");
      input.facts[field] = null;
      const result = evaluateScreening(input);
      expect(result.status).toBe("NEEDS_CLARIFICATION");
      expect(result.missingFields).toContain(`facts.${field}`);
      expect(result.findings).toEqual([]);
    },
  );
  it.each(["normal", "complete", "adequatePreparation"] as const)(
    "never infers %s from recent date",
    (field) => {
      const input = scenarioVariant("repeat-screening");
      input.facts[field] = false;
      expect(evaluateScreening(input).status).toBe("OUT_OF_SCOPE");
      input.facts[field] = null;
      expect(evaluateScreening(input).status).toBe("NEEDS_CLARIFICATION");
    },
  );
  it("unknown date stays unknown and new symptoms block despite a missing date", () => {
    expect(evaluate("unknown-date")).toMatchObject({
      status: "NEEDS_CLARIFICATION",
      missingFields: ["examinations.performedAt"],
      findings: [],
    });
    const input = scenarioVariant("repeat-screening", "unknown-date");
    input.facts.symptoms = true;
    expect(evaluateScreening(input).status).toBe("OUT_OF_SCOPE");
    expect(input.examinations[0].performedAt).toBeNull();
  });
  it.each([null, "OTHER"] as const)("handles prior screening %s", (value) => {
    const input = scenarioVariant("first-screening");
    input.facts.priorScreening = value;
    expect(evaluateScreening(input).status).toBe(
      value === null ? "NEEDS_CLARIFICATION" : "OUT_OF_SCOPE",
    );
  });
  it("clarifies unknown age and result", () => {
    const input = scenarioVariant("repeat-screening");
    input.profile.age = null;
    input.examinations[0].result.value = null;
    expect(evaluateScreening(input).missingFields).toEqual(
      expect.arrayContaining(["profile.age", "examinations.result"]),
    );
  });
  it.each([
    ["2016-11-04", "POSSIBLE_REDUNDANCY"],
    ["2016-11-03", "PREVENTIVE_OPPORTUNITY"],
    ["2016-11-02", "PREVENTIVE_OPPORTUNITY"],
  ])("uses calendar anniversary for %s", (date, category) => {
    const input = scenarioVariant("repeat-screening");
    input.examinations[0].performedAt = date;
    expect(evaluateScreening(input).findings[0].category).toBe(category);
  });
  it.each(["2026-11-04", "2026-02-30"])(
    "blocks invalid/future date %s",
    (date) => {
      const input = scenarioVariant("repeat-screening");
      input.examinations[0].performedAt = date;
      expect(evaluateScreening(input)).toMatchObject({
        status: "BLOCKED",
        findings: [],
      });
    },
  );
  it("handles leap-day anniversary conservatively", () => {
    const input = scenarioVariant("repeat-screening");
    input.examinations[0].performedAt = "2016-02-29";
    input.asOf = "2026-02-28";
    input.profile.updatedAt = "2026-02-28T00:00:00Z";
    expect(evaluateScreening(input).findings[0].category).toBe(
      "PREVENTIVE_OPPORTUNITY",
    );
  });
  it("blocks malformed, unsupported, missing or stale context", () => {
    for (const patch of [
      { scenarioId: "unbounded" },
      { contextVersion: undefined },
      { contextVersion: 2 },
      { synthetic: false },
      { asOf: "tomorrow" },
    ]) {
      expect(
        evaluateScreening({ ...scenarioVariant("first-screening"), ...patch }),
      ).toMatchObject({ status: "BLOCKED", findings: [], mayPublish: false });
    }
  });
  it("rejects cross-patient, unlinked, extra and contradictory examinations", () => {
    const inputs = Array.from({ length: 6 }, () =>
      scenarioVariant("repeat-screening"),
    );
    inputs[0].examinations[0].patientId = "another-patient";
    inputs[1].profile.examinationIds = [];
    inputs[2].examinations[0].name = "FIT";
    inputs[3].examinations[0].result.value = "Abnormal";
    inputs[4].facts.priorScreening = "NEVER_SCREENED";
    inputs[5].examinations.push({ ...inputs[5].examinations[0], id: "extra" });
    for (const input of inputs)
      expect(evaluateScreening(input).status).toBe("BLOCKED");
  });
  it("rejects missing exam references and future profile timestamps", () => {
    const input = scenarioVariant("repeat-screening");
    input.examinations = [];
    expect(evaluateScreening(input).status).toBe("BLOCKED");
    const fresh = scenarioVariant("first-screening");
    fresh.profile.updatedAt = "2026-11-04T00:00:00Z";
    expect(evaluateScreening(fresh).status).toBe("BLOCKED");
  });
  it("retains declared missing information as a block on rule readiness", () => {
    const input = scenarioVariant("first-screening");
    input.profile.missingInformation = ["Unresolved screening history"];
    expect(evaluateScreening(input).status).toBe("NEEDS_CLARIFICATION");
  });
  it("cannot mutate the canonical context or fixture through returned objects", () => {
    const context = loadClinicalContext("first-screening", 1);
    context.evidence[0].title = "Changed";
    expect(
      loadClinicalContext("first-screening", 1).evidence[0].title,
    ).not.toBe("Changed");
    const input = scenarioVariant("first-screening");
    const before = structuredClone(input);
    evaluateScreening(input);
    expect(input).toEqual(before);
  });
  it("rejects unknown and placeholder evidence and mismatched versions", () => {
    const context = loadClinicalContext("first-screening", 1);
    const rule = context.rules[0];
    expect(evidenceSupportsRule(context, rule)).toBe(true);
    expect(
      evidenceSupportsRule(context, { ...rule, evidenceIds: ["invented"] }),
    ).toBe(false);
    context.evidence[0].evidenceStatus = "placeholder";
    expect(evidenceSupportsRule(context, rule)).toBe(false);
    context.evidence[0].evidenceStatus = "public_source";
    context.evidence[0].version = 2;
    expect(evidenceSupportsRule(context, rule)).toBe(false);
  });
  it.each(flowExpectations)("fixture $scenarioId Flow $flow", (fixture) => {
    const result = evaluateScreening(
      scenarioVariant(fixture.scenarioId, fixture.variant),
    );
    expect(result.status).toBe(fixture.ruleStatus);
    expect(result.findings.map((finding) => finding.category)).toEqual(
      fixture.categories,
    );
    expect(result.mayPublish).toBe(false);
    if (fixture.flow === "D") expect(fixture.preservePriorPlan).toBe(true);
    if (fixture.flow === "E")
      expect(fixture.downstreamStatus).toBe("ANALYSIS_FAILED");
  });
});
