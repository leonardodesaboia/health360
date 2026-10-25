import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  initialAnswers,
  type IntakeAnswers,
} from "../../features/health-intake/contracts";
import { buildCompletedIntake } from "../../features/health-intake/profile";
import {
  medicalReviewSchema,
  type AIAnalysis,
  type HealthProfile,
  type MedicalReview,
  type Patient,
  type PreventivePlan,
  type PreviousExamination,
} from "../../features/patients/contracts";
import { demoReview } from "../../features/patients/fixtures";
import { buildReviewedPlan } from "../../features/preventive-plan/build";
import type { WorkflowStatus } from "../../features/workflow/workflow";
import { analyzeFromEnv } from "../ai/analyze";
import { promptMetadata } from "../ai/prompts/analysis-v1";
import { configuredProvider } from "../ai/provider/config";
import { mapIntakeFacts } from "../analysis/facts";
import { prepareAnalysis } from "../analysis/prepare";
import { loadClinicalContext } from "../clinical-rules/context";
import type { DemoContext } from "../clinical-rules/contracts";
import {
  demoCaseIdSchema,
  demoCaseLabels,
  type DemoCaseId,
  type DemoSession,
} from "../demo/contracts";
import { getDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { publishReviewedPlan } from "../preventive-plan/publication";
import { getWorkflowStatus, transitionWorkflow } from "../workflow/state";

export const LOCAL_DEMO_COOKIE = "h360_local_demo_case";

export const decisionValueSchema = z.enum([
  "APPROVE",
  "MODIFY",
  "REJECT",
  "CLARIFY",
]);
export type DecisionValue = z.infer<typeof decisionValueSchema>;

export const submitReviewInputSchema = z.object({
  analysisId: z.string().min(1),
  analysisVersion: z.number().int().positive(),
  decisions: z
    .array(
      z.object({
        proposalId: z.string().min(1),
        decision: decisionValueSchema,
        reason: z.string(),
        revisedText: z.string().nullable(),
      }),
    )
    .min(1),
});
export type SubmitReviewInput = z.infer<typeof submitReviewInputSchema>;

export type DoctorQueueState =
  | { mode: "reference" }
  | {
      mode: "session";
      caseId: DemoCaseId;
      patient: Patient;
      status: WorkflowStatus;
      profile: HealthProfile;
      examinations: PreviousExamination[];
      latestAnalysis: AIAnalysis | null;
      latestReview: MedicalReview | null;
      latestPlan: PreventivePlan | null;
    };

export type DoctorReviewState =
  | { mode: "reference" }
  | {
      mode: "session";
      caseId: DemoCaseId;
      patient: Patient;
      status: WorkflowStatus;
      profile: HealthProfile;
      examinations: PreviousExamination[];
      clinicalContext: DemoContext;
      analysis: AIAnalysis;
      existingReview: MedicalReview | null;
      publishedPlan: PreventivePlan | null;
      isCurrentAnalysis: boolean;
    };

export type SubmitReviewResult =
  | {
      status: "PUBLISHED";
      reviewId: string;
      planId: string;
    }
  | {
      status: "CLARIFICATION_REQUESTED";
      reviewId: string;
    }
  | {
      status: "INVALID" | "STALE" | "NO_SESSION";
      message: string;
    };

export type LocalHistoryEvent = {
  id: string;
  kind: string;
  occurredAt: string;
  entityId: string;
  entityVersion: number;
  provenanceLabel: string;
  title: string;
};

export type LocalFallbackRecord = {
  caseId: DemoCaseId;
  patient: Patient;
  status: WorkflowStatus;
  profile: HealthProfile;
  examinations: PreviousExamination[];
  clinicalContext: DemoContext;
  analysis: AIAnalysis;
  review: MedicalReview | null;
  plan: PreventivePlan | null;
  plansHistory: PreventivePlan[];
  eventsHistory: LocalHistoryEvent[];
};

const globalFallback = globalThis as typeof globalThis & {
  __h360LocalFallbackStore?: Map<DemoCaseId, LocalFallbackRecord>;
};

function getFallbackStore(): Map<DemoCaseId, LocalFallbackRecord> {
  return (globalFallback.__h360LocalFallbackStore ??= new Map());
}

export function baselineAnswersForCase(caseId: DemoCaseId): IntakeAnswers {
  const repeat = caseId === "repeat-screening";
  return {
    ...initialAnswers,
    age: repeat ? "60" : "50",
    rectalBleeding: "no",
    bowelChange: "no",
    weightLoss: "no",
    colorectalCancer: "no",
    polyps: "no",
    ibd: "no",
    hereditaryCancerSyndrome: "no",
    serratedPolyposis: "no",
    familyCrc: "no",
    familySyndrome: "no",
    historyDetails: "",
    medications: "None",
    smoking: "no",
    activity: "yes",
    priorScreening: repeat ? "COLONOSCOPY" : "NEVER_SCREENED",
    examName: "",
    examDatePrecision: repeat ? "EXACT" : "",
    examDate: repeat ? "2022-11-03" : "",
    examApproximateDate: "",
    examResult: "",
    colonoscopyNormal: repeat ? "yes" : "",
    colonoscopyComplete: repeat ? "yes" : "",
    colonoscopyAdequatePrep: repeat ? "yes" : "",
  };
}

export async function buildFallbackScenarioState(
  caseId: DemoCaseId,
): Promise<LocalFallbackRecord> {
  const store = getFallbackStore();
  const existing = store.get(caseId);
  if (existing) {
    if (!Array.isArray(existing.plansHistory)) {
      existing.plansHistory = existing.plan ? [existing.plan] : [];
    }
    if (!Array.isArray(existing.eventsHistory)) {
      const baseTime = existing.analysis.createdAt;
      existing.eventsHistory = [
        {
          id: `evt-profile-${caseId}-v1`,
          kind: "PROFILE_UPDATED",
          occurredAt: baseTime,
          entityId: existing.profile.id,
          entityVersion: existing.profile.version,
          provenanceLabel: "Patient-reported",
          title: "Profile created",
        },
        {
          id: `evt-intake-${caseId}-v1`,
          kind: "INTAKE_COMPLETED",
          occurredAt: baseTime,
          entityId: `intake-${caseId}-v1`,
          entityVersion: existing.profile.version,
          provenanceLabel: "Patient-reported",
          title: "Health intake completed",
        },
        {
          id: `evt-analysis-${caseId}-v1`,
          kind: "ANALYSIS_CREATED",
          occurredAt: baseTime,
          entityId: existing.analysis.id,
          entityVersion: existing.analysis.version,
          provenanceLabel: "AI-generated",
          title: "Analysis recorded",
        },
      ];
      if (existing.review) {
        const revTime =
          existing.review.completedAt ??
          existing.review.decisions[0]?.recordedAt ??
          baseTime;
        existing.eventsHistory.push({
          id: `evt-review-${caseId}-v${existing.review.version}`,
          kind: existing.review.completedAt
            ? "REVIEW_COMPLETED"
            : "REVIEW_CLARIFICATION_REQUESTED",
          occurredAt: revTime,
          entityId: existing.review.id,
          entityVersion: existing.review.version,
          provenanceLabel: "Physician-reviewed",
          title: existing.review.completedAt
            ? "Demonstration physician review completed"
            : "Reviewer requested more information",
        });
      }
      if (existing.plan) {
        existing.eventsHistory.push({
          id: `evt-plan-${caseId}-v${existing.plan.version}`,
          kind: "PLAN_PUBLISHED",
          occurredAt: existing.plan.publishedAt,
          entityId: existing.plan.id,
          entityVersion: existing.plan.version,
          provenanceLabel: "Physician-reviewed",
          title: "Reviewed plan published",
        });
      }
    }
    return existing;
  }

  const patientId = `synthetic-${caseId}`;
  const now = "2026-10-25T12:00:00.000Z";
  const completed = buildCompletedIntake(
    patientId,
    baselineAnswersForCase(caseId),
    1,
    randomUUID(),
    now,
  );
  const clinicalContext = loadClinicalContext(caseId, 1);
  const config = configuredProvider(process.env);
  const analysisId = `scenario-${caseId}`;
  const prepared = await prepareAnalysis(
    {
      synthetic: true,
      scenarioId: caseId,
      contextVersion: clinicalContext.version,
      asOf: "2026-11-03",
      profile: completed.profile,
      examinations: completed.examinations,
      facts: mapIntakeFacts(completed.profile.intakeFacts),
    },
    {
      id: analysisId,
      version: 1,
      createdAt: now,
      provider: config?.provider.id ?? "mock",
      model: config?.provider.model ?? "deterministic-v1",
      promptVersion: promptMetadata.promptVersion,
      promptId: promptMetadata.promptId,
    },
    (input) => analyzeFromEnv(input, process.env),
  );

  const record: LocalFallbackRecord = {
    caseId,
    patient: {
      id: patientId,
      displayName: demoCaseLabels[caseId].displayName,
      synthetic: true,
      status: prepared.to,
    },
    status: prepared.to,
    profile: completed.profile,
    examinations: completed.examinations,
    clinicalContext,
    analysis: prepared.analysis,
    review: null,
    plan: null,
    plansHistory: [],
    eventsHistory: [
      {
        id: `evt-profile-${caseId}-v1`,
        kind: "PROFILE_UPDATED",
        occurredAt: now,
        entityId: completed.profile.id,
        entityVersion: 1,
        provenanceLabel: "Patient-reported",
        title: "Profile created",
      },
      {
        id: `evt-intake-${caseId}-v1`,
        kind: "INTAKE_COMPLETED",
        occurredAt: now,
        entityId: completed.intake.id,
        entityVersion: 1,
        provenanceLabel: "Patient-reported",
        title: "Health intake completed",
      },
      {
        id: `evt-analysis-${caseId}-v1`,
        kind: "ANALYSIS_CREATED",
        occurredAt: now,
        entityId: prepared.analysis.id,
        entityVersion: 1,
        provenanceLabel: "AI-generated",
        title: "Analysis recorded",
      },
    ],
  };
  store.set(caseId, record);
  return record;
}

export async function getActiveLocalFallback(): Promise<LocalFallbackRecord | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(LOCAL_DEMO_COOKIE)?.value;
    const parsed = demoCaseIdSchema.safeParse(raw);
    if (!parsed.success) return null;
    return buildFallbackScenarioState(parsed.data);
  } catch {
    return null;
  }
}

export async function startLocalFallbackReassessment(
  caseId: DemoCaseId,
): Promise<void> {
  const local = await buildFallbackScenarioState(caseId);
  if (local.status !== "PLAN_AVAILABLE") return;
  const now = new Date().toISOString();
  local.status = "REASSESSMENT_PENDING";
  local.patient = { ...local.patient, status: "REASSESSMENT_PENDING" };
  local.eventsHistory.push({
    id: randomUUID(),
    kind: "REASSESSMENT_REQUESTED",
    occurredAt: now,
    entityId: local.profile.id,
    entityVersion: local.profile.version,
    provenanceLabel: "Patient-reported",
    title: "Reassessment requested",
  });
}

export async function submitLocalFallbackIntake(
  caseId: DemoCaseId,
  answers: IntakeAnswers,
  submissionId: string,
): Promise<void> {
  const local = await buildFallbackScenarioState(caseId);
  const now = new Date().toISOString();
  const nextVersion = local.profile.version + 1;
  const completed = buildCompletedIntake(
    local.patient.id,
    answers,
    nextVersion,
    submissionId,
    now,
  );
  const config = configuredProvider(process.env);
  const nextAnalysisVersion = local.analysis.version + 1;
  const prepared = await prepareAnalysis(
    {
      synthetic: true,
      scenarioId: caseId,
      contextVersion: local.clinicalContext.version,
      asOf: "2026-11-03",
      profile: completed.profile,
      examinations: completed.examinations,
      facts: mapIntakeFacts(completed.profile.intakeFacts),
    },
    {
      id: `scenario-${caseId}`,
      version: nextAnalysisVersion,
      createdAt: now,
      provider: config?.provider.id ?? "mock",
      model: config?.provider.model ?? "deterministic-v1",
      promptVersion: promptMetadata.promptVersion,
      promptId: promptMetadata.promptId,
    },
    (input) => analyzeFromEnv(input, process.env),
  );
  local.profile = completed.profile;
  local.examinations = completed.examinations;
  local.analysis = prepared.analysis;
  local.review = null;
  local.status = prepared.to;
  local.patient = { ...local.patient, status: prepared.to };
  local.eventsHistory.push(
    {
      id: randomUUID(),
      kind: "PROFILE_UPDATED",
      occurredAt: now,
      entityId: completed.profile.id,
      entityVersion: nextVersion,
      provenanceLabel: "Patient-reported",
      title: "Profile updated",
    },
    {
      id: randomUUID(),
      kind: "INTAKE_COMPLETED",
      occurredAt: now,
      entityId: completed.intake.id,
      entityVersion: nextVersion,
      provenanceLabel: "Patient-reported",
      title: "Health intake completed",
    },
    {
      id: randomUUID(),
      kind: "ANALYSIS_CREATED",
      occurredAt: now,
      entityId: prepared.analysis.id,
      entityVersion: nextAnalysisVersion,
      provenanceLabel: "AI-generated",
      title: "Analysis recorded",
    },
  );
}

export async function resolveClarificationCycle(
  session: DemoSession | null,
  resolution: "PROVIDE_DATA" | "KEEP_UNKNOWN",
  providedValue?: string,
): Promise<{ ok: boolean; status: WorkflowStatus }> {
  if (resolution === "KEEP_UNKNOWN") {
    return { ok: true, status: "CLARIFICATION_REQUIRED" };
  }

  if (session) {
    try {
      const db = getDatabase();
      await inDatasetTransaction(db, session.datasetId, async (repo, tx) => {
        const status = await getWorkflowStatus(
          tx,
          session.datasetId,
          session.patientId,
        );
        if (status !== "CLARIFICATION_REQUIRED") return;
        const profiles = (await repo.list("profile")).filter(
          (p) => p.patientId === session.patientId,
        );
        const latestVersion = Math.max(0, ...profiles.map((p) => p.version));
        const nextVersion = latestVersion + 1;
        const now = new Date().toISOString();
        const answers = baselineAnswersForCase(session.caseId);
        if (providedValue?.trim()) {
          if (session.caseId === "repeat-screening") {
            answers.examDate = providedValue.trim();
          } else if (/^\d{2}$/.test(providedValue.trim())) {
            answers.age = providedValue.trim();
          }
        }
        const completed = buildCompletedIntake(
          session.patientId,
          answers,
          nextVersion,
          randomUUID(),
          now,
        );
        for (const exam of completed.examinations)
          await repo.append("examination", exam);
        await repo.append("profile", completed.profile);
        await repo.append("intake", completed.intake);
        await repo.append("event", {
          id: randomUUID(),
          patientId: session.patientId,
          occurredAt: now,
          kind: "CLARIFICATION_ANSWERED",
          entityId: completed.profile.id,
          entityVersion: nextVersion,
          provenance: "PATIENT_REPORTED",
        });
      });
      return { ok: true, status: "MEDICAL_REVIEW_PENDING" };
    } catch {
      // Fallback to local state if DB is unreachable
    }
  }

  const local = await getActiveLocalFallback();
  if (!local) return { ok: false, status: "CLARIFICATION_REQUIRED" };
  const now = new Date().toISOString();
  const nextVersion = local.profile.version + 1;
  const answers = baselineAnswersForCase(local.caseId);
  if (providedValue?.trim() && local.caseId === "repeat-screening") {
    answers.examDate = providedValue.trim();
  }
  const completed = buildCompletedIntake(
    local.patient.id,
    answers,
    nextVersion,
    randomUUID(),
    now,
  );
  const config = configuredProvider(process.env);
  const nextAnalysisVersion = local.analysis.version + 1;
  const prepared = await prepareAnalysis(
    {
      synthetic: true,
      scenarioId: local.caseId,
      contextVersion: local.clinicalContext.version,
      asOf: "2026-11-03",
      profile: completed.profile,
      examinations: completed.examinations,
      facts: mapIntakeFacts(completed.profile.intakeFacts),
    },
    {
      id: `scenario-${local.caseId}`,
      version: nextAnalysisVersion,
      createdAt: now,
      provider: config?.provider.id ?? "mock",
      model: config?.provider.model ?? "deterministic-v1",
      promptVersion: promptMetadata.promptVersion,
      promptId: promptMetadata.promptId,
    },
    (input) => analyzeFromEnv(input, process.env),
  );
  local.profile = completed.profile;
  local.examinations = completed.examinations;
  local.analysis = prepared.analysis;
  local.review = null;
  local.status = prepared.to;
  local.patient = { ...local.patient, status: prepared.to };
  local.eventsHistory.push(
    {
      id: randomUUID(),
      kind: "CLARIFICATION_ANSWERED",
      occurredAt: now,
      entityId: completed.profile.id,
      entityVersion: nextVersion,
      provenanceLabel: "Patient-reported",
      title: "Information updated",
    },
    {
      id: randomUUID(),
      kind: "ANALYSIS_CREATED",
      occurredAt: now,
      entityId: prepared.analysis.id,
      entityVersion: nextAnalysisVersion,
      provenanceLabel: "AI-generated",
      title: "Analysis recorded",
    },
  );
  return { ok: true, status: local.status };
}

const latestByVersion = <T extends { version: number }>(items: T[]): T | null =>
  items.reduce<T | null>(
    (acc, item) => (!acc || item.version > acc.version ? item : acc),
    null,
  );

export async function loadDoctorQueue(
  session: DemoSession | null,
): Promise<DoctorQueueState> {
  if (!session) {
    const local = await getActiveLocalFallback();
    if (local) {
      return {
        mode: "session",
        caseId: local.caseId,
        patient: local.patient,
        status: local.status,
        profile: local.profile,
        examinations: local.examinations,
        latestAnalysis: local.analysis,
        latestReview: local.review,
        latestPlan: local.plan,
      };
    }
    return { mode: "reference" };
  }
  const db = getDatabase();
  return inDatasetTransaction(db, session.datasetId, async (repo, tx) => {
    const status = await getWorkflowStatus(
      tx,
      session.datasetId,
      session.patientId,
    );
    const [profiles, examinations, analyses, reviews, plans] =
      await Promise.all([
        repo.list("profile"),
        repo.list("examination"),
        repo.list("analysis"),
        repo.list("review"),
        repo.list("plan"),
      ]);
    const ownedProfiles = profiles.filter(
      (p) => p.patientId === session.patientId,
    );
    const profile = latestByVersion(ownedProfiles) ?? session.profile;
    const linkedExams = examinations.filter(
      (e) =>
        e.patientId === session.patientId &&
        profile.examinationIds.includes(e.id),
    );
    const latestAnalysis = latestByVersion(
      analyses.filter((a) => a.patientId === session.patientId),
    );
    const latestReview = latestByVersion(
      reviews.filter((r) => r.patientId === session.patientId),
    );
    const latestPlan = latestByVersion(
      plans.filter((p) => p.patientId === session.patientId),
    );
    return {
      mode: "session",
      caseId: session.caseId,
      patient: { ...session.patient, status },
      status,
      profile,
      examinations: linkedExams,
      latestAnalysis,
      latestReview,
      latestPlan,
    };
  });
}

export async function loadDoctorReview(
  session: DemoSession | null,
  reviewOrAnalysisId: string,
): Promise<DoctorReviewState | null> {
  if (
    reviewOrAnalysisId === "scenario-first-screening" ||
    reviewOrAnalysisId === "scenario-repeat-screening"
  ) {
    const caseId: DemoCaseId =
      reviewOrAnalysisId === "scenario-repeat-screening"
        ? "repeat-screening"
        : "first-screening";
    const local = await buildFallbackScenarioState(caseId);
    return {
      mode: "session",
      caseId: local.caseId,
      patient: local.patient,
      status: local.status,
      profile: local.profile,
      examinations: local.examinations,
      clinicalContext: local.clinicalContext,
      analysis: local.analysis,
      existingReview: local.review,
      publishedPlan: local.plan,
      isCurrentAnalysis: true,
    };
  }

  if (!session) {
    return reviewOrAnalysisId === demoReview.id ? { mode: "reference" } : null;
  }
  const db = getDatabase();
  return inDatasetTransaction(db, session.datasetId, async (repo, tx) => {
    const status = await getWorkflowStatus(
      tx,
      session.datasetId,
      session.patientId,
    );
    const [profiles, examinations, analyses, reviews, plans] =
      await Promise.all([
        repo.list("profile"),
        repo.list("examination"),
        repo.list("analysis"),
        repo.list("review"),
        repo.list("plan"),
      ]);
    const ownedAnalyses = analyses.filter(
      (a) => a.patientId === session.patientId,
    );
    const ownedReviews = reviews.filter(
      (r) => r.patientId === session.patientId,
    );
    const matchedReview = latestByVersion(
      ownedReviews.filter((r) => r.id === reviewOrAnalysisId),
    );
    const analysis =
      latestByVersion(
        ownedAnalyses.filter((a) => a.id === reviewOrAnalysisId),
      ) ??
      (matchedReview
        ? (ownedAnalyses.find(
            (a) =>
              a.id === matchedReview.analysisId &&
              a.version === matchedReview.analysisVersion,
          ) ?? null)
        : null);

    if (!analysis) {
      return reviewOrAnalysisId === demoReview.id
        ? { mode: "reference" }
        : null;
    }

    const ownedProfiles = profiles.filter(
      (p) => p.patientId === session.patientId,
    );
    const latestProfile = latestByVersion(ownedProfiles) ?? session.profile;
    const profile =
      ownedProfiles.find((p) => p.version === analysis.profileVersion) ??
      latestProfile;
    const linkedExams = examinations.filter(
      (e) =>
        e.patientId === session.patientId &&
        profile.examinationIds.includes(e.id),
    );
    const latestAnalysis = latestByVersion(ownedAnalyses);
    const existingReview = latestByVersion(
      ownedReviews.filter(
        (r) =>
          r.analysisId === analysis.id &&
          r.analysisVersion === analysis.version,
      ),
    );
    const publishedPlan = existingReview
      ? (plans.find(
          (p) =>
            p.patientId === session.patientId &&
            p.reviewId === existingReview.id &&
            p.reviewVersion === existingReview.version,
        ) ?? null)
      : null;

    return {
      mode: "session",
      caseId: session.caseId,
      patient: { ...session.patient, status },
      status,
      profile,
      examinations: linkedExams,
      clinicalContext: session.clinicalContext,
      analysis,
      existingReview,
      publishedPlan,
      isCurrentAnalysis:
        analysis.status === "PRELIMINARY" &&
        latestAnalysis?.id === analysis.id &&
        latestAnalysis?.version === analysis.version &&
        latestProfile.version === analysis.profileVersion,
    };
  });
}

export async function recordLocalFallbackReview(
  caseId: DemoCaseId,
  rawInput: unknown,
): Promise<SubmitReviewResult> {
  const parsed = submitReviewInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      status: "INVALID",
      message: "Complete all decision fields before submitting the review.",
    };
  }
  const input = parsed.data;
  const local = await buildFallbackScenarioState(caseId);

  for (const d of input.decisions) {
    if (!d.reason.trim()) {
      return {
        status: "INVALID",
        message:
          "A clinical rationale is required for every physician decision.",
      };
    }
    if (d.decision === "MODIFY" && !d.revisedText?.trim()) {
      return {
        status: "INVALID",
        message:
          "Provide the revised patient-facing wording when modifying a proposal.",
      };
    }
  }

  const now = new Date().toISOString();
  const hasClarification = input.decisions.some(
    (d) => d.decision === "CLARIFY",
  );
  const nextReviewVersion = (local.review?.version ?? 0) + 1;
  const reviewId = `review-${caseId}-v${nextReviewVersion}`;
  const reviewRecord = medicalReviewSchema.parse({
    id: reviewId,
    version: nextReviewVersion,
    patientId: local.patient.id,
    analysisId: local.analysis.id,
    analysisVersion: local.analysis.version,
    reviewerId: "demo-physician-rostand",
    completedAt: hasClarification ? null : now,
    decisions: input.decisions.map((d) => ({
      proposalId: d.proposalId,
      decision: d.decision,
      reason: d.reason.trim(),
      revisedText:
        d.decision === "MODIFY" ? (d.revisedText?.trim() ?? null) : null,
      recordedAt: now,
    })),
  });

  local.review = reviewRecord;

  if (hasClarification) {
    local.status = "CLARIFICATION_REQUIRED";
    local.patient = { ...local.patient, status: "CLARIFICATION_REQUIRED" };
    local.eventsHistory.push({
      id: randomUUID(),
      kind: "REVIEW_CLARIFICATION_REQUESTED",
      occurredAt: now,
      entityId: reviewId,
      entityVersion: nextReviewVersion,
      provenanceLabel: "Physician-reviewed",
      title: "Reviewer requested more information",
    });
    return { status: "CLARIFICATION_REQUESTED", reviewId };
  }

  const nextPlanVersion = (local.plan?.version ?? 0) + 1;
  const plan = buildReviewedPlan({
    id: `plan-${caseId}-v${nextPlanVersion}`,
    patientId: local.patient.id,
    profile: local.profile,
    analysis: local.analysis,
    review: reviewRecord,
    context: local.clinicalContext,
    latestAnalysisVersion: local.analysis.version,
    latestReviewVersion: reviewRecord.version,
    previousPlan: local.plan,
    publishedAt: now,
    status: "MEDICAL_REVIEW_COMPLETED",
  });

  local.plan = plan;
  local.plansHistory = [plan, ...local.plansHistory];
  local.status = "PLAN_AVAILABLE";
  local.patient = { ...local.patient, status: "PLAN_AVAILABLE" };
  local.eventsHistory.push(
    {
      id: randomUUID(),
      kind: "REVIEW_COMPLETED",
      occurredAt: now,
      entityId: reviewId,
      entityVersion: nextReviewVersion,
      provenanceLabel: "Physician-reviewed",
      title: "Demonstration physician review completed",
    },
    {
      id: randomUUID(),
      kind: "PLAN_PUBLISHED",
      occurredAt: now,
      entityId: plan.id,
      entityVersion: plan.version,
      provenanceLabel: "Physician-reviewed",
      title: "Reviewed plan published",
    },
  );
  return {
    status: "PUBLISHED",
    reviewId,
    planId: plan.id,
  };
}

export async function recordPhysicianReview(
  session: DemoSession,
  rawInput: unknown,
): Promise<SubmitReviewResult> {
  const parsed = submitReviewInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      status: "INVALID",
      message: "Complete all decision fields before submitting the review.",
    };
  }
  const input = parsed.data;
  const db = getDatabase();

  return inDatasetTransaction(db, session.datasetId, async (repo, tx) => {
    const status = await getWorkflowStatus(
      tx,
      session.datasetId,
      session.patientId,
    );
    const [profiles, analyses, reviews] = await Promise.all([
      repo.list("profile"),
      repo.list("analysis"),
      repo.list("review"),
    ]);
    const latestProfile = latestByVersion(
      profiles.filter((p) => p.patientId === session.patientId),
    );
    const ownedAnalyses = analyses.filter(
      (a) => a.patientId === session.patientId,
    );
    const latestAnalysis = latestByVersion(ownedAnalyses);
    const analysis = ownedAnalyses.find(
      (a) => a.id === input.analysisId && a.version === input.analysisVersion,
    );

    if (
      !latestProfile ||
      !latestAnalysis ||
      !analysis ||
      analysis.status !== "PRELIMINARY" ||
      analysis.id !== latestAnalysis.id ||
      analysis.version !== latestAnalysis.version ||
      analysis.profileVersion !== latestProfile.version
    ) {
      return {
        status: "STALE",
        message:
          "This analysis is no longer the current version for the patient profile.",
      };
    }

    if (
      status !== "MEDICAL_REVIEW_PENDING" &&
      status !== "MEDICAL_REVIEW_IN_PROGRESS"
    ) {
      return {
        status: "STALE",
        message: `Review cannot be finalized while workflow status is ${status}.`,
      };
    }

    const proposalIds = new Set(analysis.proposals.map((p) => p.id));
    const decisionMap = new Map(input.decisions.map((d) => [d.proposalId, d]));
    if (
      proposalIds.size !== decisionMap.size ||
      [...proposalIds].some((id) => !decisionMap.has(id))
    ) {
      return {
        status: "INVALID",
        message: "Every preliminary proposal requires an explicit decision.",
      };
    }

    for (const d of input.decisions) {
      if (!d.reason.trim()) {
        return {
          status: "INVALID",
          message:
            "A clinical rationale is required for every physician decision.",
        };
      }
      if (d.decision === "MODIFY" && !d.revisedText?.trim()) {
        return {
          status: "INVALID",
          message:
            "Provide the revised patient-facing wording when modifying a proposal.",
        };
      }
    }

    const ownedReviews = reviews.filter(
      (r) => r.patientId === session.patientId,
    );
    const existingForAnalysis = latestByVersion(
      ownedReviews.filter(
        (r) =>
          r.analysisId === analysis.id &&
          r.analysisVersion === analysis.version,
      ),
    );
    const reviewId = existingForAnalysis?.id ?? randomUUID();
    const reviewVersion = (latestByVersion(ownedReviews)?.version ?? 0) + 1;
    const now = new Date().toISOString();
    const hasClarification = input.decisions.some(
      (d) => d.decision === "CLARIFY",
    );

    if (status === "MEDICAL_REVIEW_PENDING") {
      await transitionWorkflow(tx, session.datasetId, {
        patientId: session.patientId,
        expectedFrom: "MEDICAL_REVIEW_PENDING",
        to: "MEDICAL_REVIEW_IN_PROGRESS",
        actor: "demo-physician",
        refs: {
          profileVersion: latestProfile.version,
          analysisId: analysis.id,
          reviewId,
        },
      });
    }

    const reviewRecord = medicalReviewSchema.parse({
      id: reviewId,
      version: reviewVersion,
      patientId: session.patientId,
      analysisId: analysis.id,
      analysisVersion: analysis.version,
      reviewerId: "demo-physician-rostand",
      completedAt: hasClarification ? null : now,
      decisions: input.decisions.map((d) => ({
        proposalId: d.proposalId,
        decision: d.decision,
        reason: d.reason.trim(),
        revisedText:
          d.decision === "MODIFY" ? (d.revisedText?.trim() ?? null) : null,
        recordedAt: now,
      })),
    });

    await repo.append("review", reviewRecord);

    if (hasClarification) {
      await transitionWorkflow(tx, session.datasetId, {
        patientId: session.patientId,
        expectedFrom: "MEDICAL_REVIEW_IN_PROGRESS",
        to: "CLARIFICATION_REQUIRED",
        actor: "demo-physician",
        reason: "Physician requested additional patient clarification.",
        refs: {
          profileVersion: latestProfile.version,
          analysisId: analysis.id,
          reviewId,
        },
      });
      await repo.append("event", {
        id: randomUUID(),
        patientId: session.patientId,
        occurredAt: now,
        kind: "REVIEW_CLARIFICATION_REQUESTED",
        entityId: reviewId,
        entityVersion: reviewVersion,
        provenance: "PHYSICIAN_REVIEWED",
      });
      return { status: "CLARIFICATION_REQUESTED", reviewId };
    }

    await transitionWorkflow(tx, session.datasetId, {
      patientId: session.patientId,
      expectedFrom: "MEDICAL_REVIEW_IN_PROGRESS",
      to: "MEDICAL_REVIEW_COMPLETED",
      actor: "demo-physician",
      refs: {
        profileVersion: latestProfile.version,
        analysisId: analysis.id,
        reviewId,
      },
    });
    await repo.append("event", {
      id: randomUUID(),
      patientId: session.patientId,
      occurredAt: now,
      kind: "REVIEW_COMPLETED",
      entityId: reviewId,
      entityVersion: reviewVersion,
      provenance: "PHYSICIAN_REVIEWED",
    });

    const plan = await publishReviewedPlan(
      tx,
      session.datasetId,
      session.patientId,
      reviewId,
    );

    return {
      status: "PUBLISHED",
      reviewId,
      planId: plan.id,
    };
  });
}
