import type {
  AIAnalysis,
  ClinicalContext,
  HealthProfile,
  MedicalReview,
  Patient,
  PreviousExamination,
} from "../patients/contracts";
import type { WorkflowStatus } from "../workflow/workflow";
import type { DemoContext } from "../../server/clinical-rules/contracts";
import { fields } from "../health-intake/contracts";

export type ReviewRecords = {
  patients: Patient[];
  profiles: HealthProfile[];
  examinations: PreviousExamination[];
  analyses: AIAnalysis[];
  contexts: ClinicalContext[];
  reviews: MedicalReview[];
  workflowStatus?: WorkflowStatus;
  contextDetails?: DemoContext;
};

export function workspaceId(analysis: AIAnalysis) {
  return `${analysis.id}--v${analysis.version}`;
}

export function findWorkspace(
  data: ReviewRecords,
  patientId: string,
  id: string,
) {
  const patient = data.patients.find((p) => p.id === patientId);
  const linkedReview = data.reviews
    .filter((r) => r.patientId === patientId && r.id === id)
    .sort((a, b) => b.version - a.version)[0];
  const analysis = data.analyses.find(
    (a) =>
      a.patientId === patientId &&
      (workspaceId(a) === id ||
        (linkedReview?.analysisId === a.id &&
          linkedReview.analysisVersion === a.version)),
  );
  if (!patient || !analysis) return null;
  const profiles = data.profiles.filter((p) => p.patientId === patientId);
  const profile = profiles.find((p) => p.version === analysis.profileVersion);
  const contexts = data.contexts.filter((c) => c.id === analysis.contextId);
  const context = contexts.find((c) => c.version === analysis.contextVersion);
  if (!profile || !context) return null;
  const stale =
    profiles.some((p) => p.version > profile.version) ||
    contexts.some((c) => c.version > context.version) ||
    data.analyses.some(
      (a) => a.patientId === patientId && a.version > analysis.version,
    );
  const review =
    data.reviews
      .filter(
        (r) =>
          r.patientId === patientId &&
          r.analysisId === analysis.id &&
          r.analysisVersion === analysis.version,
      )
      .sort((a, b) => b.version - a.version)[0] ?? null;
  return {
    patient,
    workflowStatus: data.workflowStatus ?? patient.status,
    analysis,
    profile,
    context,
    contextDetails:
      data.contextDetails?.id === context.id &&
      data.contextDetails.version === context.version
        ? data.contextDetails
        : null,
    stale,
    review,
    examinations: data.examinations.filter(
      (e) => e.patientId === patientId && profile.examinationIds.includes(e.id),
    ),
  };
}

export type ReviewWorkspace = NonNullable<ReturnType<typeof findWorkspace>>;

export function reviewableProposals(analysis: AIAnalysis) {
  return analysis.status === "PRELIMINARY" ? analysis.proposals : [];
}

export function declaredFacts(profile: HealthProfile) {
  return Object.entries(profile.intakeFacts ?? {}).flatMap(([key, value]) => {
    const field = fields.find((item) => item.id === key);
    if (!field) return [];
    const text =
      value === null
        ? "Unknown"
        : value === true
          ? "Yes"
          : value === false
            ? "No"
            : (field.options?.find(([option]) => option === value)?.[1] ??
              "Unknown");
    return [{ id: key, label: field.label, text }];
  });
}

export function buildQueue(data: ReviewRecords, patientId: string) {
  const latest = data.analyses
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => b.version - a.version)[0];
  if (!latest) return [];
  const workspace = findWorkspace(data, patientId, workspaceId(latest));
  return workspace ? [workspace] : [];
}

export function safeEvidenceUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
