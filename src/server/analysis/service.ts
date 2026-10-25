import "server-only";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  aiAnalysisSchema,
  clinicalContextSchema,
  type ClinicalContext,
} from "../../features/patients/contracts";
import { DEMONSTRATIVE_LABEL } from "../clinical-rules/contracts";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import type {
  AIAnalysis,
  HealthProfile,
  PreviousExamination,
} from "../../features/patients/contracts";
import {
  canTransition,
  type WorkflowStatus,
} from "../../features/workflow/workflow";
import type { DemoSession } from "../demo/contracts";
import type * as Workflow from "../workflow/state";
import { inDatasetTransaction, type DatasetRepository } from "../db/repository";
import { loadClinicalContext } from "../clinical-rules/context";
import { mapIntakeFacts } from "./facts";
import {
  prepareAnalysis,
  type AnalysisIdentity,
  type Explanation,
} from "./prepare";

export type AnalysisServiceResult =
  | {
      status: "RECORDED";
      analysisId: string;
      workflowStatus:
        "ANALYSIS_FAILED" | "CLARIFICATION_REQUIRED" | "MEDICAL_REVIEW_PENDING";
    }
  | { status: "EXISTING"; analysisId: string }
  | { status: "BUSY" | "STALE" | "NOT_READY" };
/**
 * Runs inside the claim transaction after the workflow lock is held and a claim is
 * legal, before the latest profile is read. Throwing rolls back every write, so a
 * caller can append a new profile version atomically with ANALYSIS_PENDING.
 */
export type ClaimHook = (
  repo: DatasetRepository,
  tx: Prisma.TransactionClient,
  status: WorkflowStatus,
) => Promise<void>;
export type AnalysisDependencies = {
  workflow: Pick<typeof Workflow, "getWorkflowStatus" | "transitionWorkflow">;
  beforeClaim?: ClaimHook;
  explain: Explanation;
  audit: Pick<
    AnalysisIdentity,
    "provider" | "model" | "promptVersion" | "promptId"
  >;
  now?: () => Date;
};
type AnalysisSnapshot =
  | { result: AnalysisServiceResult }
  | {
      profile: HealthProfile;
      context: ClinicalContext;
      examinations: PreviousExamination[];
      identity: AnalysisIdentity;
      blockedContext: boolean;
    };
const latest = <T extends { version: number }>(records: T[]) =>
  records.reduce<T | undefined>(
    (current, record) =>
      !current || record.version > current.version ? record : current,
    undefined,
  );
const factsFor = (profile: HealthProfile) =>
  mapIntakeFacts("intakeFacts" in profile ? profile.intakeFacts : undefined);

function contextMatches(record: ClinicalContext) {
  try {
    return isDeepStrictEqual(
      record,
      clinicalContextSchema.parse(
        loadClinicalContext(record.scenarioId, record.version),
      ),
    );
  } catch {
    return false;
  }
}

/** Caller supplies the resolved demo cookie session, never client-selected scope. */
export async function analyzeSession(
  db: PrismaClient,
  session: Pick<DemoSession, "datasetId" | "patientId" | "caseId">,
  deps: AnalysisDependencies,
): Promise<AnalysisServiceResult> {
  const { datasetId, patientId, caseId } = session;
  const { workflow } = deps;
  const now = deps.now ?? (() => new Date());
  const snapshot = await inDatasetTransaction<AnalysisSnapshot>(
    db,
    datasetId,
    async (repo, tx) => {
      const status = await workflow.getWorkflowStatus(tx, datasetId, patientId);
      if (deps.beforeClaim) {
        if (!canTransition(status, "ANALYSIS_PENDING"))
          return {
            result: {
              status: status === "ANALYSIS_PENDING" ? "BUSY" : "NOT_READY",
            },
          };
        await deps.beforeClaim(repo, tx, status);
      }
      const profile = latest(
        (await repo.list("profile")).filter(
          (record) => record.patientId === patientId,
        ),
      );
      const contextRecord = latest(
        (await repo.list("context")).filter(
          (record) => record.scenarioId === caseId,
        ),
      );
      if (!profile || !contextRecord)
        return { result: { status: "NOT_READY" } };
      const context = contextRecord;
      const blockedContext = !contextMatches(contextRecord);
      const analyses = (await repo.list("analysis")).filter(
        (record) => record.patientId === patientId,
      );
      const existing = latest(
        analyses.filter(
          (record) =>
            record.status === "PRELIMINARY" &&
            record.profileVersion === profile.version &&
            record.contextId === context.id &&
            record.contextVersion === context.version,
        ),
      );
      if (existing)
        return {
          result: {
            status: "EXISTING",
            analysisId: existing.id,
          },
        };
      if (!canTransition(status, "ANALYSIS_PENDING"))
        return {
          result: {
            status: status === "ANALYSIS_PENDING" ? "BUSY" : "NOT_READY",
          },
        };
      const identity: AnalysisIdentity = {
        ...deps.audit,
        id: randomUUID(),
        version: (latest(analyses)?.version ?? 0) + 1,
        createdAt: now().toISOString(),
      };
      await workflow.transitionWorkflow(tx, datasetId, {
        patientId,
        expectedFrom: status,
        to: "ANALYSIS_PENDING",
        actor: "system",
        refs: { analysisId: identity.id, profileVersion: profile.version },
      });
      const examinations = (await repo.list("examination")).filter((exam) =>
        profile.examinationIds.includes(exam.id),
      );
      return { profile, context, examinations, identity, blockedContext };
    },
  );
  return completeSnapshot(db, session, deps, snapshot);
}

/**
 * Continues the open ANALYSIS_PENDING reservation recorded in the workflow (for example
 * one created atomically by the clarification answer, or one left by an interrupted
 * run). The reservation comes from stored workflow refs, never from the caller. A
 * reservation whose profile version is no longer current fails as STALE so the patient
 * can retry. Concurrent resumes may repeat provider work, but at most one analysis is
 * recorded for the reservation.
 */
export async function resumePendingAnalysis(
  db: PrismaClient,
  session: Pick<DemoSession, "datasetId" | "patientId" | "caseId">,
  deps: Omit<AnalysisDependencies, "beforeClaim">,
): Promise<AnalysisServiceResult> {
  const { datasetId, patientId, caseId } = session;
  const { workflow } = deps;
  const now = deps.now ?? (() => new Date());
  const snapshot = await inDatasetTransaction<AnalysisSnapshot>(
    db,
    datasetId,
    async (repo, tx) => {
      const status = await workflow.getWorkflowStatus(tx, datasetId, patientId);
      if (status !== "ANALYSIS_PENDING")
        return { result: { status: "NOT_READY" } };
      const reservation = latest(
        (await repo.list("workflowTransition")).filter(
          (record) => record.patientId === patientId,
        ),
      );
      const analysisId = reservation?.refs?.analysisId;
      const reservedVersion = reservation?.refs?.profileVersion;
      const profile = latest(
        (await repo.list("profile")).filter(
          (record) => record.patientId === patientId,
        ),
      );
      const contextRecord = latest(
        (await repo.list("context")).filter(
          (record) => record.scenarioId === caseId,
        ),
      );
      if (
        !analysisId ||
        reservedVersion === undefined ||
        !profile ||
        !contextRecord
      )
        return { result: { status: "NOT_READY" } };
      const analyses = (await repo.list("analysis")).filter(
        (record) => record.patientId === patientId,
      );
      if (analyses.some((record) => record.id === analysisId))
        return { result: { status: "EXISTING", analysisId } };
      if (profile.version !== reservedVersion) {
        await workflow.transitionWorkflow(tx, datasetId, {
          patientId,
          expectedFrom: status,
          expectedRefs: { analysisId, profileVersion: reservedVersion },
          to: "ANALYSIS_FAILED",
          actor: "system",
          reason:
            "Analysis input versions changed. Retry with the current profile.",
          refs: { analysisId, profileVersion: reservedVersion },
        });
        return { result: { status: "STALE" } };
      }
      const identity: AnalysisIdentity = {
        ...deps.audit,
        id: analysisId,
        version: (latest(analyses)?.version ?? 0) + 1,
        createdAt: now().toISOString(),
      };
      const examinations = (await repo.list("examination")).filter((exam) =>
        profile.examinationIds.includes(exam.id),
      );
      return {
        profile,
        context: contextRecord,
        examinations,
        identity,
        blockedContext: !contextMatches(contextRecord),
      };
    },
  );
  return completeSnapshot(db, session, deps, snapshot);
}

async function completeSnapshot(
  db: PrismaClient,
  session: Pick<DemoSession, "datasetId" | "patientId" | "caseId">,
  deps: Omit<AnalysisDependencies, "beforeClaim">,
  snapshot: AnalysisSnapshot,
): Promise<AnalysisServiceResult> {
  if ("result" in snapshot) return snapshot.result;
  const { datasetId, patientId, caseId } = session;
  const { workflow, explain } = deps;
  const { profile, context, examinations, identity, blockedContext } = snapshot;
  const prepared = blockedContext
    ? {
        to: "ANALYSIS_FAILED" as const,
        analysis: aiAnalysisSchema.parse({
          ...identity,
          patientId,
          profileVersion: profile.version,
          contextId: context.id,
          contextVersion: context.version,
          summary: `${DEMONSTRATIVE_LABEL}. Analysis is blocked because the supplied evidence context is unsupported. Retry after the context is restored.`,
          relevantInformation: [],
          missingInformation: [],
          uncertainties: ["Evidence context integrity could not be verified."],
          reviewQuestions: [],
          proposals: [],
          status: "BLOCKED",
          failureReason: "unsupported_context",
        }),
      }
    : await prepareAnalysis(
        {
          synthetic: true,
          scenarioId: caseId,
          contextVersion: context.version,
          asOf: identity.createdAt.slice(0, 10),
          profile,
          examinations,
          facts: factsFor(profile),
        },
        identity,
        explain,
      );
  return inDatasetTransaction<AnalysisServiceResult>(
    db,
    datasetId,
    async (repo, tx) => {
      const status = await workflow.getWorkflowStatus(tx, datasetId, patientId);
      const currentProfile = latest(
        (await repo.list("profile")).filter(
          (record) => record.patientId === patientId,
        ),
      );
      const currentContext = latest(
        (await repo.list("context")).filter(
          (record) => record.scenarioId === caseId,
        ),
      );
      const reservation = latest(
        (await repo.list("workflowTransition")).filter(
          (record) => record.patientId === patientId,
        ),
      );
      if (
        status !== "ANALYSIS_PENDING" ||
        reservation?.refs?.analysisId !== identity.id
      )
        return { status: "STALE" };
      if (
        currentProfile?.version !== profile.version ||
        currentContext?.id !== context.id ||
        currentContext?.version !== context.version
      ) {
        await workflow.transitionWorkflow(tx, datasetId, {
          patientId,
          expectedFrom: status,
          expectedRefs: {
            analysisId: identity.id,
            profileVersion: profile.version,
          },
          to: "ANALYSIS_FAILED",
          actor: "system",
          reason:
            "Analysis input versions changed. Retry with the current profile.",
          refs: { profileVersion: profile.version, analysisId: identity.id },
        });
        return { status: "STALE" };
      }
      const duplicate: AIAnalysis | undefined = (
        await repo.list("analysis")
      ).find((record) => record.id === identity.id);
      if (duplicate) return { status: "EXISTING", analysisId: duplicate.id };
      await repo.append("analysis", prepared.analysis);
      await repo.append("event", {
        id: randomUUID(),
        patientId,
        occurredAt: identity.createdAt,
        kind:
          prepared.to === "ANALYSIS_FAILED"
            ? "ANALYSIS_FAILED"
            : prepared.to === "CLARIFICATION_REQUIRED"
              ? "CLARIFICATION_REQUESTED"
              : "ANALYSIS_CREATED",
        entityId: identity.id,
        entityVersion: identity.version,
        provenance:
          prepared.to === "MEDICAL_REVIEW_PENDING"
            ? "AI_GENERATED"
            : "RULE_GENERATED",
      });
      await workflow.transitionWorkflow(tx, datasetId, {
        patientId,
        expectedFrom: status,
        expectedRefs: {
          analysisId: identity.id,
          profileVersion: profile.version,
        },
        to: prepared.to,
        actor: "system",
        refs: { analysisId: identity.id, profileVersion: profile.version },
      });
      return {
        status: "RECORDED",
        analysisId: identity.id,
        workflowStatus: prepared.to,
      };
    },
  ).catch(async () => {
    await inDatasetTransaction(db, datasetId, async (repo, tx) => {
      const status = await workflow.getWorkflowStatus(tx, datasetId, patientId);
      const reservation = latest(
        (await repo.list("workflowTransition")).filter(
          (record) => record.patientId === patientId,
        ),
      );
      if (
        status === "ANALYSIS_PENDING" &&
        reservation?.refs?.analysisId === identity.id
      ) {
        await workflow.transitionWorkflow(tx, datasetId, {
          patientId,
          expectedFrom: status,
          expectedRefs: {
            analysisId: identity.id,
            profileVersion: profile.version,
          },
          to: "ANALYSIS_FAILED",
          actor: "system",
          reason: "Analysis could not be saved. Retry the analysis.",
          refs: { analysisId: identity.id, profileVersion: profile.version },
        });
      }
    });
    throw new Error("Analysis could not be saved. Retry the analysis.");
  });
}
