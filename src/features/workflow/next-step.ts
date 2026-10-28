import { workflowPresentation } from "./presentation";
import type { WorkflowStatus } from "./workflow";

export type PatientNextStep = {
  title: string;
  description: string;
  href: string;
  action: string;
  /** Legacy three-step view; no guarded plan read means it cannot be all complete. */
  completedSteps: 0 | 1 | 2 | 3;
};

/** Compatibility adapter. New routes use workflowPresentation with guarded plan availability. */
export function patientNextStep(status: WorkflowStatus): PatientNextStep {
  const model = workflowPresentation(
    { status, planState: "none", canContinueSavedAnalysis: false },
    "home",
  );
  if (model.primary.kind !== "link")
    throw new Error("Home guidance requires a navigation action");
  return {
    title: model.heading,
    description: model.explanation,
    href: model.primary.href,
    action: model.primary.label,
    completedSteps:
      model.stages[2].state === "complete"
        ? 2
        : model.stages[0].state === "complete"
          ? 1
          : 0,
  };
}
