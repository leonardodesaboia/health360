import { describe, expect, it } from "vitest";
import { patientNextStep } from "./next-step";
import { workflowStatuses } from "./workflow";

describe("patientNextStep", () => {
  it("gives every status one actionable patient route", () => {
    for (const status of workflowStatuses) {
      const step = patientNextStep(status);
      expect(step.href).toMatch(/^\/patient(\/|$)/);
      expect(step.action).not.toBe("");
    }
  });

  it("never marks review or plan done before the plan is published", () => {
    for (const status of workflowStatuses.filter((s) => s !== "PLAN_AVAILABLE"))
      expect(patientNextStep(status).completedSteps).toBeLessThan(3);
    expect(patientNextStep("MEDICAL_REVIEW_PENDING").completedSteps).toBe(1);
    expect(patientNextStep("PLAN_AVAILABLE").completedSteps).toBe(2);
  });

  it("routes each blocking state to the screen that resolves it", () => {
    expect(patientNextStep("NOT_STARTED").href).toBe("/patient/intake");
    expect(patientNextStep("CLARIFICATION_REQUIRED").href).toBe(
      "/patient/clarification",
    );
    expect(patientNextStep("ANALYSIS_FAILED").href).toBe("/patient/analysis");
    expect(patientNextStep("MEDICAL_REVIEW_IN_PROGRESS").href).toBe(
      "/patient/analysis",
    );
  });
});
