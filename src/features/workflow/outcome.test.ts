import { describe, expect, it } from "vitest";
import { analysisOutcome } from "./outcome";
import { workflowPresentation } from "./presentation";

const blocked = (
  failureReason:
    "out_of_scope" | "missing_information" | "invalid_input" | "timeout",
  relevantInformation: string[] = [],
) => ({ status: "BLOCKED" as const, failureReason, relevantInformation });
describe("stored analysis outcome guidance", () => {
  it.each([
    [["symptoms: true"], "Symptoms were reported"],
    [["personalRiskHistory: true"], "Personal risk history was reported"],
    [
      ["familySyndrome: true"],
      "Lynch syndrome or familial adenomatous polyposis",
    ],
    [["priorScreening: OTHER"], "Another prior screening test was reported"],
    [["Age: 80"], "specific exclusion reason is unavailable"],
    [["normal: false"], "examination details"],
    [["familyRiskHistory: true"], "specific exclusion reason is unavailable"],
    [[], "criteria"],
  ])("explains an exclusion from recorded facts %j", (facts, text) => {
    const outcome = analysisOutcome(blocked("out_of_scope", facts));
    expect(outcome?.explanation).toContain(text);
    expect(outcome?.explanation).not.toMatch(/retry/i);
    expect(outcome?.provenance).toContain("Rule-generated");
    for (const page of ["home", "analysis", "plan", "history"] as const) {
      const model = workflowPresentation(
        {
          status: "ANALYSIS_FAILED",
          planState: "none",
          canContinueSavedAnalysis: false,
          outcome,
        },
        page,
      );
      expect(model.primary).toEqual({
        kind: "link",
        label: "Update my information",
        href: "/patient/intake",
      });
    }
  });
  it("uses the evaluator reason for age-only and family-history exclusions", () => {
    expect(
      analysisOutcome({
        ...blocked("out_of_scope"),
        ruleReason: "Age is outside demonstration criteria",
      })?.explanation,
    ).toContain("reported age");
    expect(
      analysisOutcome({
        ...blocked("out_of_scope"),
        ruleReason: "Prior screening is outside family-history criteria",
      })?.explanation,
    ).toContain("never-screened");
  });
  it("does not infer symptoms from unknown values or a provider failure", () => {
    expect(
      analysisOutcome(blocked("out_of_scope", ["symptoms: unknown"]))
        ?.explanation,
    ).not.toContain("Symptoms were reported");
    expect(analysisOutcome(blocked("timeout", ["symptoms: true"]))?.kind).toBe(
      "provider-failure",
    );
  });
  it("keeps provider retry, clarification, and deterministic blocking distinct", () => {
    expect(analysisOutcome(blocked("timeout"))?.kind).toBe("provider-failure");
    expect(analysisOutcome(blocked("missing_information"))?.kind).toBe(
      "clarification",
    );
    const snapshot = {
      status: "ANALYSIS_FAILED" as const,
      planState: "none" as const,
      canContinueSavedAnalysis: false,
    };
    expect(
      workflowPresentation(
        { ...snapshot, outcome: analysisOutcome(blocked("timeout")) },
        "analysis",
      ).primary,
    ).toEqual({
      kind: "task",
      task: "retry-analysis",
      label: "Retry analysis",
    });
    expect(
      workflowPresentation(
        {
          ...snapshot,
          status: "CLARIFICATION_REQUIRED",
          outcome: analysisOutcome(blocked("missing_information")),
        },
        "analysis",
      ).primary,
    ).toEqual({
      kind: "link",
      label: "Answer missing information",
      href: "/patient/clarification",
    });
    const outcome = analysisOutcome(blocked("invalid_input"));
    expect(
      workflowPresentation({ ...snapshot, outcome }, "analysis").primary,
    ).toEqual({
      kind: "link",
      label: "Update my information",
      href: "/patient/intake",
    });
    expect(outcome?.kind).toBe("blocked");
    expect(outcome?.explanation).not.toMatch(/retry/i);
    expect(
      analysisOutcome({ status: "PRELIMINARY", relevantInformation: [] }),
    ).toBeNull();
  });
});

it("explains deterministic blocking without treating contradictory facts as provider failure", () => {
  const outcome = analysisOutcome({
    ...blocked("invalid_input"),
    ruleReason: "Screening history contradicts examination facts",
  });
  expect(outcome?.explanation).toBe(
    "The reported screening history conflicts with the saved examination information.",
  );
  expect(outcome?.kind).toBe("blocked");
});
