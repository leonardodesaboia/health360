import { describe, expect, it } from "vitest";
import {
  canTransition,
  transition,
  workflowStatuses,
  type WorkflowStatus,
} from "./workflow";

// Independent product specification: deliberately not derived from the transition map.
const allowed: Record<WorkflowStatus, WorkflowStatus[]> = {
  NOT_STARTED: ["INTAKE_IN_PROGRESS"],
  INTAKE_IN_PROGRESS: ["INTAKE_COMPLETED"],
  INTAKE_COMPLETED: ["INTAKE_IN_PROGRESS", "ANALYSIS_PENDING"],
  ANALYSIS_PENDING: [
    "ANALYSIS_FAILED",
    "CLARIFICATION_REQUIRED",
    "MEDICAL_REVIEW_PENDING",
  ],
  ANALYSIS_FAILED: ["ANALYSIS_PENDING", "INTAKE_IN_PROGRESS"],
  CLARIFICATION_REQUIRED: ["ANALYSIS_PENDING"],
  MEDICAL_REVIEW_PENDING: ["MEDICAL_REVIEW_IN_PROGRESS"],
  MEDICAL_REVIEW_IN_PROGRESS: [
    "CLARIFICATION_REQUIRED",
    "MEDICAL_REVIEW_COMPLETED",
  ],
  MEDICAL_REVIEW_COMPLETED: ["PLAN_AVAILABLE"],
  PLAN_AVAILABLE: ["REASSESSMENT_PENDING"],
  REASSESSMENT_PENDING: ["INTAKE_IN_PROGRESS", "ANALYSIS_PENDING"],
};

describe("workflow adjacency contract", () => {
  for (const from of workflowStatuses) {
    for (const to of workflowStatuses) {
      it(`${from} → ${to}`, () => {
        const legal = allowed[from].includes(to);
        expect(canTransition(from, to)).toBe(legal);
        if (legal) expect(transition(from, to)).toBe(to);
        else
          expect(() => transition(from, to)).toThrow(
            "Illegal workflow transition",
          );
      });
    }
  }
});

describe("safety-sensitive journeys", () => {
  it("requires review before publication and retains the reassessment cycle", () => {
    const path: WorkflowStatus[] = [
      "NOT_STARTED",
      "INTAKE_IN_PROGRESS",
      "INTAKE_COMPLETED",
      "ANALYSIS_PENDING",
      "MEDICAL_REVIEW_PENDING",
      "MEDICAL_REVIEW_IN_PROGRESS",
      "MEDICAL_REVIEW_COMPLETED",
      "PLAN_AVAILABLE",
      "REASSESSMENT_PENDING",
      "ANALYSIS_PENDING",
    ];
    expect(path.reduce((state, next) => transition(state, next))).toBe(
      "ANALYSIS_PENDING",
    );
  });
  it("retries failures and sends clarification through analysis again", () => {
    expect(transition("ANALYSIS_FAILED", "ANALYSIS_PENDING")).toBe(
      "ANALYSIS_PENDING",
    );
    expect(transition("CLARIFICATION_REQUIRED", "ANALYSIS_PENDING")).toBe(
      "ANALYSIS_PENDING",
    );
    expect(() =>
      transition("CLARIFICATION_REQUIRED", "PLAN_AVAILABLE"),
    ).toThrow();
  });
});
