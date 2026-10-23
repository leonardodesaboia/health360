import { describe, expect, it } from "vitest";
import {
  workflowTransitionSchema,
  workflowTransitionInputSchema,
} from "./contracts";
const input = {
  patientId: "synthetic",
  expectedFrom: "NOT_STARTED",
  to: "INTAKE_IN_PROGRESS",
  actor: "patient",
};
describe("workflow audit contracts", () => {
  it("requires an actor and rejects invalid states, edges and reference versions", () => {
    expect(workflowTransitionInputSchema.safeParse(input).success).toBe(true);
    expect(
      workflowTransitionInputSchema.safeParse({
        ...input,
        expectedRefs: { analysisId: "attempt", profileVersion: 1 },
      }).success,
    ).toBe(true);
    expect(
      workflowTransitionInputSchema.safeParse({
        ...input,
        expectedRefs: { profileVersion: 0 },
      }).success,
    ).toBe(false);
    expect(
      workflowTransitionInputSchema.safeParse({ ...input, actor: undefined })
        .success,
    ).toBe(false);
    expect(
      workflowTransitionInputSchema.safeParse({ ...input, actor: "physician" })
        .success,
    ).toBe(false);
    expect(
      workflowTransitionInputSchema.safeParse({ ...input, to: "UNKNOWN" })
        .success,
    ).toBe(false);
    expect(
      workflowTransitionInputSchema.safeParse({
        ...input,
        refs: { profileVersion: 0 },
      }).success,
    ).toBe(false);
    expect(
      workflowTransitionSchema.safeParse({
        id: "event",
        patientId: "synthetic",
        version: 1,
        from: "NOT_STARTED",
        to: "PLAN_AVAILABLE",
        actor: "system",
        occurredAt: "2026-10-23T00:00:00Z",
      }).success,
    ).toBe(false);
  });
});
