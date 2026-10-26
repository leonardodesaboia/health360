import type { WorkflowStatus } from "./workflow";

export type PatientNextStep = {
  title: string;
  description: string;
  href: string;
  action: string;
  /** Journey steps finished: 0 history, 1 physician review, 2 plan, 3 all. */
  completedSteps: 0 | 1 | 2 | 3;
};

/** Patient-facing next step for an administrative workflow status. Not a clinical status. */
export function patientNextStep(status: WorkflowStatus): PatientNextStep {
  switch (status) {
    case "NOT_STARTED":
      return {
        title: "Start your health intake",
        description:
          "Answer questions about the synthetic scenario. You can answer I don't know; unknown answers stay unknown.",
        href: "/patient/intake",
        action: "Start health intake",
        completedSteps: 0,
      };
    case "INTAKE_IN_PROGRESS":
      return {
        title: "Finish your health intake",
        description:
          "Complete and confirm your answers to request a preliminary analysis.",
        href: "/patient/intake",
        action: "Continue health intake",
        completedSteps: 0,
      };
    case "REASSESSMENT_PENDING":
      return {
        title: "Update your information",
        description:
          "Confirm your updated answers. They go through another analysis and physician review. Your earlier plan stays in history.",
        href: "/patient/intake",
        action: "Continue health intake",
        completedSteps: 0,
      };
    case "INTAKE_COMPLETED":
      return {
        title: "Request a preliminary analysis",
        description:
          "Your confirmed information is ready. Any analysis is preliminary and goes to a physician for review.",
        href: "/patient/analysis",
        action: "Go to analysis",
        completedSteps: 1,
      };
    case "ANALYSIS_PENDING":
      return {
        title: "Analysis in preparation",
        description: "Check the analysis status to continue.",
        href: "/patient/analysis",
        action: "View analysis status",
        completedSteps: 1,
      };
    case "ANALYSIS_FAILED":
      return {
        title: "The analysis could not be completed",
        description:
          "No proposals were created. You can retry with your current information.",
        href: "/patient/analysis",
        action: "View analysis status",
        completedSteps: 1,
      };
    case "CLARIFICATION_REQUIRED":
      return {
        title: "Answer a few missing questions",
        description:
          "More information is needed before the analysis can continue. You can still answer I don't know.",
        href: "/patient/clarification",
        action: "Answer missing information",
        completedSteps: 1,
      };
    case "MEDICAL_REVIEW_PENDING":
    case "MEDICAL_REVIEW_IN_PROGRESS":
      return {
        title: "Awaiting physician review",
        description:
          "A physician must review the preliminary proposals. Your plan appears only after the review is finalized.",
        href: "/patient/plan",
        action: "View plan status",
        completedSteps: 1,
      };
    case "MEDICAL_REVIEW_COMPLETED":
      return {
        title: "Physician review completed",
        description: "Your reviewed plan is being prepared.",
        href: "/patient/plan",
        action: "View plan status",
        completedSteps: 2,
      };
    case "PLAN_AVAILABLE":
      return {
        title: "Your reviewed plan is available",
        description:
          "It contains only items decided in the demonstration physician review.",
        href: "/patient/plan",
        action: "View my plan",
        completedSteps: 3,
      };
  }
}
