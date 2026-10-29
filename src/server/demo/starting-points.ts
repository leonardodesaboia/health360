import "server-only";
import { z } from "zod";
import { demoCaseIds, demoCaseIdSchema } from "./contracts";

const startingPoints = [
  {
    id: "alex-review",
    caseId: "first-screening",
    label: "Alex — physician review",
    destination: "/doctor",
  },
  {
    id: "jordan-review",
    caseId: "repeat-screening",
    label: "Jordan — possible redundancy review",
    destination: "/doctor",
  },
  {
    id: "alex-plan-v1",
    caseId: "first-screening",
    label: "Alex — reviewed plan v1",
    destination: "/patient/plan",
  },
  {
    id: "alex-analysis-failed",
    caseId: "first-screening",
    label: "Alex — analysis failed, ready to retry",
    destination: "/patient/analysis",
  },
  {
    id: "daniel-review",
    caseId: "family-history-screening",
    label: "Daniel — family-history review",
    destination: "/doctor",
  },
  {
    id: "daniel-plan-v1",
    caseId: "family-history-screening",
    label: "Daniel — reviewed plan v1",
    destination: "/patient/plan",
  },
] as const;
export const preparedDemoStates = startingPoints.map((state) => ({
  ...state,
  synthetic: true as const,
  validation: "demonstrative" as const,
}));
export const preparedDemoStateIdSchema = z.enum(
  preparedDemoStates.map((state) => state.id),
);
export type PreparedDemoStateId = z.infer<typeof preparedDemoStateIdSchema>;
export const demoSelectionIdSchema = z.enum([
  ...demoCaseIds,
  ...preparedDemoStates.map((state) => state.id),
]);

/** Prepared states embed deterministic mock analyses, so they exist only in mock mode. */
export function preparedStatesAvailable() {
  return (process.env.LLM_PROVIDER ?? "mock") === "mock";
}

export function preparedDemoState(id: PreparedDemoStateId) {
  const state = preparedDemoStates.find((item) => item.id === id);
  if (!state) throw new Error("Unsupported prepared demonstration state");
  return state;
}

export function resolveDemoSelection(input: unknown) {
  const id = demoSelectionIdSchema.parse(input);
  const baseline = demoCaseIdSchema.safeParse(id);
  return baseline.success
    ? { caseId: baseline.data, preparedStateId: undefined, destination: null }
    : {
        ...preparedDemoState(preparedDemoStateIdSchema.parse(id)),
        preparedStateId: preparedDemoStateIdSchema.parse(id),
      };
}
