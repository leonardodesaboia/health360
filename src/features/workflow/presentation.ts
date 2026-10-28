import { statusLabels, type WorkflowStatus } from "./workflow";

export type JourneyStageId = "intake" | "analysis" | "review" | "plan";
export type JourneyStageState =
  "not-started" | "current" | "complete" | "blocked" | "waiting";
export type GuidancePage =
  | "home"
  | "intake"
  | "profile"
  | "analysis"
  | "clarification"
  | "plan"
  | "history";
export type PatientWorkflowSnapshot = Readonly<{
  status: WorkflowStatus;
  planState: "none" | "current" | "previous" | "unavailable";
  canContinueSavedAnalysis: boolean;
}>;
export type GuidanceAction =
  | { kind: "link"; label: string; href: string }
  | { kind: "refresh"; label: "Refresh status" }
  | {
      kind: "task";
      label: string;
      task:
        | "analyze"
        | "retry-analysis"
        | "answer-questions"
        | "continue-intake"
        | "continue-saved-analysis";
    };
export type WorkflowPresentation = Readonly<{
  status: WorkflowStatus;
  label: string;
  stages: readonly {
    id: JourneyStageId;
    label: string;
    state: JourneyStageState;
  }[];
  branch: null | { kind: "clarification" | "reassessment"; label: string };
  heading: string;
  explanation: string;
  actor: "You" | "System" | "Demo reviewer";
  primary: GuidanceAction;
  previousPlanMessage: string | null;
}>;

type Copy = {
  heading: string;
  explanation: string;
  actor: WorkflowPresentation["actor"];
  label: string;
  href: string;
};
const copy: Record<WorkflowStatus, Copy> = {
  NOT_STARTED: {
    heading: "Start your health intake",
    explanation:
      "Answer questions about this synthetic case. You can choose ‘I don't know’ when unsure.",
    actor: "You",
    label: "Start health intake",
    href: "/patient/intake",
  },
  INTAKE_IN_PROGRESS: {
    heading: "Continue your health intake",
    explanation:
      "Your draft is saved in this browser. Confirm your answers to save a profile for this demo case.",
    actor: "You",
    label: "Continue health intake",
    href: "/patient/intake",
  },
  INTAKE_COMPLETED: {
    heading: "Ready for analysis",
    explanation:
      "Your confirmed information is saved. Start a preliminary analysis; any proposals still require physician review.",
    actor: "You",
    label: "Go to analysis",
    href: "/patient/analysis",
  },
  ANALYSIS_PENDING: {
    heading: "Waiting for analysis",
    explanation:
      "An analysis request is pending. Check for the latest recorded status. No plan is published by this step.",
    actor: "System",
    label: "View analysis status",
    href: "/patient/analysis",
  },
  ANALYSIS_FAILED: {
    heading: "Retry the analysis",
    explanation:
      "This attempt did not produce reviewable proposals. Retry with your saved information. A successful analysis still requires physician review.",
    actor: "You",
    label: "Go to retry analysis",
    href: "/patient/analysis",
  },
  CLARIFICATION_REQUIRED: {
    heading: "Answer the requested questions",
    explanation:
      "More information is needed before a new analysis and physician review can continue. Unknown answers stay unknown.",
    actor: "You",
    label: "Answer missing information",
    href: "/patient/clarification",
  },
  MEDICAL_REVIEW_PENDING: {
    heading: "Waiting for the demo reviewer",
    explanation:
      "Your preliminary analysis is ready for review. A demo reviewer must decide on every proposal and finalize the review before a plan can appear. No completion time is promised.",
    actor: "Demo reviewer",
    label: "View review status",
    href: "/patient/analysis",
  },
  MEDICAL_REVIEW_IN_PROGRESS: {
    heading: "Review has started",
    explanation:
      "The review is in progress. Your plan appears only after the demo reviewer finalizes the decisions. No completion time is promised.",
    actor: "Demo reviewer",
    label: "View review status",
    href: "/patient/analysis",
  },
  MEDICAL_REVIEW_COMPLETED: {
    heading: "Check plan status",
    explanation:
      "The review has been finalized. Check whether the reviewed plan is available.",
    actor: "System",
    label: "Check plan status",
    href: "/patient/plan",
  },
  PLAN_AVAILABLE: {
    heading: "Your reviewed demonstration plan",
    explanation:
      "This plan contains only decisions from the finalized demonstration review. Demo reviewer decisions are not clinical validation.",
    actor: "You",
    label: "View my plan",
    href: "/patient/plan",
  },
  REASSESSMENT_PENDING: {
    heading: "Update your information",
    explanation:
      "Confirm your updated answers. They need another analysis and physician review. Your earlier reviewed plan stays in history.",
    actor: "You",
    label: "Continue health intake",
    href: "/patient/intake",
  },
};
const stages: Record<WorkflowStatus, readonly JourneyStageState[]> = {
  NOT_STARTED: ["not-started", "waiting", "waiting", "waiting"],
  INTAKE_IN_PROGRESS: ["current", "waiting", "waiting", "waiting"],
  INTAKE_COMPLETED: ["complete", "current", "waiting", "waiting"],
  ANALYSIS_PENDING: ["complete", "current", "waiting", "waiting"],
  ANALYSIS_FAILED: ["complete", "blocked", "waiting", "waiting"],
  CLARIFICATION_REQUIRED: ["complete", "blocked", "waiting", "waiting"],
  MEDICAL_REVIEW_PENDING: ["complete", "complete", "current", "waiting"],
  MEDICAL_REVIEW_IN_PROGRESS: ["complete", "complete", "current", "waiting"],
  MEDICAL_REVIEW_COMPLETED: ["complete", "complete", "complete", "waiting"],
  PLAN_AVAILABLE: ["complete", "complete", "complete", "waiting"],
  REASSESSMENT_PENDING: ["current", "waiting", "waiting", "waiting"],
};
const stageNames = [
  ["intake", "Intake"],
  ["analysis", "Analysis"],
  ["review", "Physician review"],
  ["plan", "Plan"],
] as const;

/** Presentation only: accepts administrative state and guarded plan availability, never clinical content. */
export function workflowPresentation(
  snapshot: PatientWorkflowSnapshot,
  page: GuidancePage,
): WorkflowPresentation {
  const { status, planState } = snapshot;
  const currentPlan = status === "PLAN_AVAILABLE" && planState === "current";
  const unverifiedPlan = status === "PLAN_AVAILABLE" && !currentPlan;
  const entry = unverifiedPlan
    ? {
        ...copy.PLAN_AVAILABLE,
        heading: "Check plan status",
        explanation:
          "Check the reviewed plan for this evaluation. It is shown only when the stored publication can be verified.",
        label: "Check plan status",
      }
    : copy[status];
  let primary: GuidanceAction = {
    kind: "link",
    label: entry.label,
    href: entry.href,
  };
  let explanation = entry.explanation;
  if (page === "analysis") {
    if (status === "INTAKE_COMPLETED")
      primary = {
        kind: "task",
        task: "analyze",
        label: "Analyze current profile",
      };
    else if (status === "ANALYSIS_FAILED")
      primary = {
        kind: "task",
        task: "retry-analysis",
        label: "Retry analysis",
      };
    else if (
      [
        "ANALYSIS_PENDING",
        "MEDICAL_REVIEW_PENDING",
        "MEDICAL_REVIEW_IN_PROGRESS",
      ].includes(status)
    )
      primary = { kind: "refresh", label: "Refresh status" };
  }
  if (
    page === "intake" &&
    ["NOT_STARTED", "INTAKE_IN_PROGRESS", "REASSESSMENT_PENDING"].includes(
      status,
    )
  )
    primary = {
      kind: "task",
      task: "continue-intake",
      label: "Save and continue",
    };
  if (page === "clarification") {
    if (status === "CLARIFICATION_REQUIRED")
      primary = {
        kind: "task",
        task: "answer-questions",
        label: "Save answers and analyze again",
      };
    else if (
      status === "ANALYSIS_PENDING" &&
      snapshot.canContinueSavedAnalysis
    ) {
      primary = {
        kind: "task",
        task: "continue-saved-analysis",
        label: "Continue saved analysis",
      };
      explanation =
        "Your answers are saved. Continue the saved analysis without submitting them again.";
    }
  }
  if (
    page === "plan" &&
    (status === "MEDICAL_REVIEW_COMPLETED" || unverifiedPlan)
  )
    primary = { kind: "refresh", label: "Refresh status" };
  if (currentPlan && (page === "plan" || page === "history"))
    primary = {
      kind: "link",
      label: "View update options",
      href: "/patient/history#update-information",
    };
  return {
    status,
    label: unverifiedPlan ? "Review finalized" : statusLabels[status],
    heading: entry.heading,
    explanation,
    actor: entry.actor,
    primary,
    stages: stageNames.map(([id, label], index) => ({
      id,
      label,
      state: currentPlan ? "complete" : stages[status][index],
    })),
    branch:
      status === "CLARIFICATION_REQUIRED"
        ? {
            kind: "clarification",
            label: "Information needed → Analysis again → Physician review",
          }
        : status === "REASSESSMENT_PENDING" || planState === "previous"
          ? {
              kind: "reassessment",
              label: "New evaluation; previous plan preserved",
            }
          : null,
    previousPlanMessage:
      planState === "previous"
        ? "Your earlier reviewed plan is preserved while this evaluation continues."
        : null,
  };
}
