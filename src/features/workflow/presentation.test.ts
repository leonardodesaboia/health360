import { describe, expect, it } from "vitest";
import { workflowPresentation } from "./presentation";
import type { WorkflowStatus } from "./workflow";

const cases = [
  [
    "NOT_STARTED",
    ["not-started", "waiting", "waiting", "waiting"],
    "/patient/intake",
    "Start health intake",
  ],
  [
    "INTAKE_IN_PROGRESS",
    ["current", "waiting", "waiting", "waiting"],
    "/patient/intake",
    "Continue health intake",
  ],
  [
    "INTAKE_COMPLETED",
    ["complete", "current", "waiting", "waiting"],
    "/patient/analysis",
    "Go to analysis",
  ],
  [
    "ANALYSIS_PENDING",
    ["complete", "current", "waiting", "waiting"],
    "/patient/analysis",
    "View analysis status",
  ],
  [
    "ANALYSIS_FAILED",
    ["complete", "blocked", "waiting", "waiting"],
    "/patient/analysis",
    "Go to retry analysis",
  ],
  [
    "CLARIFICATION_REQUIRED",
    ["complete", "blocked", "waiting", "waiting"],
    "/patient/clarification",
    "Answer missing information",
  ],
  [
    "MEDICAL_REVIEW_PENDING",
    ["complete", "complete", "current", "waiting"],
    "/patient/analysis",
    "View review status",
  ],
  [
    "MEDICAL_REVIEW_IN_PROGRESS",
    ["complete", "complete", "current", "waiting"],
    "/patient/analysis",
    "View review status",
  ],
  [
    "MEDICAL_REVIEW_COMPLETED",
    ["complete", "complete", "complete", "waiting"],
    "/patient/plan",
    "Check plan status",
  ],
  [
    "PLAN_AVAILABLE",
    ["complete", "complete", "complete", "waiting"],
    "/patient/plan",
    "Check plan status",
  ],
  [
    "REASSESSMENT_PENDING",
    ["current", "waiting", "waiting", "waiting"],
    "/patient/intake",
    "Continue health intake",
  ],
] as const;
const snapshot = (status: WorkflowStatus) => ({
  status,
  planState: "none" as const,
  canContinueSavedAnalysis: false,
});
describe("workflow presentation", () => {
  it.each(cases)(
    "projects %s from recorded state",
    (status, states, href, label) => {
      const model = workflowPresentation(snapshot(status), "home");
      expect(model.stages.map((s) => s.state)).toEqual(states);
      expect(model.stages.map((s) => s.label)).toEqual([
        "Intake",
        "Analysis",
        "Physician review",
        "Plan",
      ]);
      expect(model.primary).toEqual({ kind: "link", href, label });
      expect(model.branch).toEqual(
        status === "CLARIFICATION_REQUIRED"
          ? {
              kind: "clarification",
              label: "Information needed → Analysis again → Physician review",
            }
          : status === "REASSESSMENT_PENDING"
            ? {
                kind: "reassessment",
                label: "New evaluation; previous plan preserved",
              }
            : null,
      );
    },
  );
  it("requires a guarded current plan to complete the journey", () => {
    for (const planState of ["none", "previous", "unavailable"] as const) {
      const model = workflowPresentation(
        { ...snapshot("PLAN_AVAILABLE"), planState },
        "plan",
      );
      expect(model.stages[3].state).toBe("waiting");
      expect(model.primary).toEqual({
        kind: "refresh",
        label: "Refresh status",
      });
      expect(model.label).toBe("Review finalized");
    }
    const model = workflowPresentation(
      { ...snapshot("PLAN_AVAILABLE"), planState: "current" },
      "plan",
    );
    expect(model.stages.map((s) => s.state)).toEqual([
      "complete",
      "complete",
      "complete",
      "complete",
    ]);
    expect(model.primary).toEqual({
      kind: "link",
      label: "View update options",
      href: "/patient/history#update-information",
    });
  });
  it.each([
    "INTAKE_IN_PROGRESS",
    "INTAKE_COMPLETED",
    "REASSESSMENT_PENDING",
  ] as const)(
    "preserves previous plans without carrying completion into %s",
    (status) => {
      const model = workflowPresentation(
        { ...snapshot(status), planState: "previous" },
        "plan",
      );
      expect(model.branch?.kind).toBe("reassessment");
      expect(model.stages[2].state).toBe("waiting");
      expect(model.previousPlanMessage).toBe(
        "Your earlier reviewed plan is preserved while this evaluation continues.",
      );
    },
  );
  it.each([
    ["INTAKE_COMPLETED", "analysis", "analyze", "Analyze current profile"],
    ["ANALYSIS_FAILED", "analysis", "retry-analysis", "Retry analysis"],
    [
      "CLARIFICATION_REQUIRED",
      "clarification",
      "answer-questions",
      "Save answers and analyze again",
    ],
    ["NOT_STARTED", "intake", "continue-intake", "Save and continue"],
  ] as const)(
    "uses the existing task for %s on %s",
    (status, page, task, label) => {
      expect(workflowPresentation(snapshot(status), page).primary).toEqual({
        kind: "task",
        task,
        label,
      });
    },
  );
  it("offers saved continuation only on its confirmed recovery route", () => {
    const input = {
      ...snapshot("ANALYSIS_PENDING"),
      canContinueSavedAnalysis: true,
    };
    expect(workflowPresentation(input, "clarification").primary).toEqual({
      kind: "task",
      task: "continue-saved-analysis",
      label: "Continue saved analysis",
    });
    expect(workflowPresentation(input, "analysis").primary.kind).toBe(
      "refresh",
    );
  });
  it.each([
    "ANALYSIS_PENDING",
    "MEDICAL_REVIEW_PENDING",
    "MEDICAL_REVIEW_IN_PROGRESS",
    "MEDICAL_REVIEW_COMPLETED",
    "PLAN_AVAILABLE",
  ] as const)("refreshes instead of self-linking for %s", (status) => {
    const page =
      status === "PLAN_AVAILABLE" || status === "MEDICAL_REVIEW_COMPLETED"
        ? "plan"
        : "analysis";
    expect(workflowPresentation(snapshot(status), page).primary).toEqual({
      kind: "refresh",
      label: "Refresh status",
    });
  });
});
