import "server-only";

import type { PrismaClient } from "../../generated/prisma/client";
import { analyze } from "../ai/analyze";
import { configuredProvider } from "../ai/provider/config";
import { promptMetadata } from "../ai/prompts/analysis-v1";
import type { DemoSession } from "../demo/contracts";
import * as workflow from "../workflow/state";
import {
  analyzeSession,
  resumePendingAnalysis,
  type AnalysisDependencies,
  type AnalysisServiceResult,
  type ClaimHook,
} from "./service";

type Session = Pick<DemoSession, "datasetId" | "patientId" | "caseId">;

function configuredDependencies(): Omit<AnalysisDependencies, "beforeClaim"> {
  const config = configuredProvider(process.env);
  return {
    workflow,
    audit: {
      provider: config?.provider.id ?? "unconfigured",
      model: config?.provider.model ?? "unconfigured",
      promptVersion: promptMetadata.promptVersion,
      promptId: promptMetadata.promptId,
    },
    explain: config
      ? (input) => analyze(input, config.provider, config.timeoutMs)
      : async () => ({ status: "BLOCKED", reason: "configuration" }),
  };
}

/**
 * Runs analysis for an already-resolved demo session with the configured provider.
 * Valid from INTAKE_COMPLETED, CLARIFICATION_REQUIRED, ANALYSIS_FAILED and
 * REASSESSMENT_PENDING. Callers must obtain `session` from getDemoSession, never
 * from client input. Not a server action. `options.beforeClaim` runs inside the
 * claim transaction (see ClaimHook) for atomic profile append plus ANALYSIS_PENDING.
 */
export function runAnalysisForSession(
  db: PrismaClient,
  session: Session,
  options: { beforeClaim?: ClaimHook } = {},
): Promise<AnalysisServiceResult> {
  return analyzeSession(db, session, {
    ...configuredDependencies(),
    beforeClaim: options.beforeClaim,
  });
}

/**
 * Continues the open ANALYSIS_PENDING reservation stored in the workflow, whether a
 * caller reserved it atomically or an earlier run was interrupted. Same session rules
 * as runAnalysisForSession. Not a server action.
 */
export function resumeAnalysisForSession(
  db: PrismaClient,
  session: Session,
): Promise<AnalysisServiceResult> {
  return resumePendingAnalysis(db, session, configuredDependencies());
}
