import type {
  AIAnalysis,
  ClinicalContext,
  HealthProfile,
  MedicalReview,
  Patient,
  PreviousExamination,
} from "../patients/contracts";
import type { WorkflowStatus } from "../workflow/workflow";

export type ReviewRecords = {
  patients: Patient[];
  profiles: HealthProfile[];
  examinations: PreviousExamination[];
  analyses: AIAnalysis[];
  contexts: ClinicalContext[];
  reviews: MedicalReview[];
  workflowStatus?: WorkflowStatus;
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
  const analysis = data.analyses.find(
    (a) => a.patientId === patientId && workspaceId(a) === id,
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
    stale,
    review,
    examinations: data.examinations.filter(
      (e) => e.patientId === patientId && profile.examinationIds.includes(e.id),
    ),
  };
}

export type ReviewWorkspace = NonNullable<ReturnType<typeof findWorkspace>>;

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
