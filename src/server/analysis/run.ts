import "server-only";

import type { PrismaClient } from "../../generated/prisma/client";
import { analyze } from "../ai/analyze";
import { configuredProvider } from "../ai/provider/config";
import { promptMetadata } from "../ai/prompts/analysis-v1";
import type { DemoSession } from "../demo/contracts";
import * as workflow from "../workflow/state";
import {
  analyzeSession,
  type AnalysisServiceResult,
  type ClaimHook,
} from "./service";

/**
 * Runs analysis for an already-resolved demo session with the configured provider.
 * Valid from INTAKE_COMPLETED, CLARIFICATION_REQUIRED, ANALYSIS_FAILED and
 * REASSESSMENT_PENDING. Callers must obtain `session` from getDemoSession, never
 * from client input. Not a server action. `options.beforeClaim` runs inside the
 * claim transaction (see ClaimHook) for atomic profile append plus ANALYSIS_PENDING.
 */
export function runAnalysisForSession(
  db: PrismaClient,
  session: Pick<DemoSession, "datasetId" | "patientId" | "caseId">,
  options: { beforeClaim?: ClaimHook } = {},
): Promise<AnalysisServiceResult> {
  const config = configuredProvider(process.env);
  return analyzeSession(db, session, {
    workflow,
    beforeClaim: options.beforeClaim,
    audit: {
      provider: config?.provider.id ?? "unconfigured",
      model: config?.provider.model ?? "unconfigured",
      promptVersion: promptMetadata.promptVersion,
      promptId: promptMetadata.promptId,
    },
    explain: config
      ? (input) => analyze(input, config.provider, config.timeoutMs)
      : async () => ({ status: "BLOCKED", reason: "configuration" }),
  });
}
