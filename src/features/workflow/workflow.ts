/** Administrative lifecycle only. A transition is not clinical authorization. */
export const workflowStatuses = [
  "NOT_STARTED",
  "INTAKE_IN_PROGRESS",
  "INTAKE_COMPLETED",
  "ANALYSIS_PENDING",
  "ANALYSIS_FAILED",
  "CLARIFICATION_REQUIRED",
  "MEDICAL_REVIEW_PENDING",
  "MEDICAL_REVIEW_IN_PROGRESS",
  "MEDICAL_REVIEW_COMPLETED",
  "PLAN_AVAILABLE",
  "REASSESSMENT_PENDING",
] as const;
export type WorkflowStatus = (typeof workflowStatuses)[number];

export const transitions = {
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
} as const satisfies Record<WorkflowStatus, readonly WorkflowStatus[]>;

export function canTransition(
  from: WorkflowStatus,
  to: WorkflowStatus,
): boolean {
  return (transitions[from] as readonly WorkflowStatus[]).includes(to);
}

/** Future server services must validate evidence, versions and review completion first. */
export function transition(
  from: WorkflowStatus,
  to: WorkflowStatus,
): WorkflowStatus {
  if (!canTransition(from, to))
    throw new Error(`Illegal workflow transition: ${from} → ${to}`);
  return to;
}

export const statusLabels: Record<WorkflowStatus, string> = {
  NOT_STARTED: "Avaliação não iniciada",
  INTAKE_IN_PROGRESS: "Histórico em preenchimento",
  INTAKE_COMPLETED: "Histórico preenchido",
  ANALYSIS_PENDING: "Análise em preparação",
  ANALYSIS_FAILED: "Análise não concluída",
  CLARIFICATION_REQUIRED: "Informação a confirmar",
  MEDICAL_REVIEW_PENDING: "Aguardando revisão médica",
  MEDICAL_REVIEW_IN_PROGRESS: "Em revisão médica",
  MEDICAL_REVIEW_COMPLETED: "Revisão concluída",
  PLAN_AVAILABLE: "Plano disponível",
  REASSESSMENT_PENDING: "Reavaliação pendente",
};
