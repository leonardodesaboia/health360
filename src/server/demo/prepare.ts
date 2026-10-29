import "server-only";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../../generated/prisma/client";
import { startIntake, completeIntake } from "../intake/service";
import { runAnalysisForSession } from "../analysis/run";
import { analyzeSession } from "../analysis/service";
import { analyze } from "../ai/analyze";
import { MockProvider } from "../ai/provider/mock";
import { promptMetadata } from "../ai/prompts/analysis-v1";
import * as workflow from "../workflow/state";
import { recordReview } from "../clinical-review/decisions";
import { workspaceId } from "../../features/clinical-review/reader";
import { datasetRepository } from "../db/repository";
import { replaceDemoDataset } from "./store";
import { demoCaseRecords } from "./records";
import { preparedIntakeAnswers } from "./prepared-answers";
import {
  preparedDemoState,
  preparedStatesAvailable,
  type PreparedDemoStateId,
} from "./starting-points";

export function requirePreparedMockProvider() {
  if (!preparedStatesAvailable())
    throw new Error("Prepared demonstration states require LLM_PROVIDER=mock.");
}

/** Caller allocates a fresh server-derived scope and activates it only after success. */
export async function prepareDemoDataset(
  db: PrismaClient,
  datasetId: string,
  stateId: PreparedDemoStateId,
) {
  requirePreparedMockProvider();
  if (await db.dataset.findUnique({ where: { id: datasetId } }))
    throw new Error("Prepared demonstration states require a fresh dataset.");
  const state = preparedDemoState(stateId);
  const patientId = demoCaseRecords(state.caseId).patient.id;
  const session = { datasetId, patientId, caseId: state.caseId };
  await replaceDemoDataset(db, datasetId, state.caseId);
  try {
    await startIntake(db, datasetId, patientId);
    await completeIntake(
      db,
      datasetId,
      patientId,
      preparedIntakeAnswers(state.caseId),
      randomUUID(),
    );
    const failedStartingPoint = stateId === "alex-analysis-failed";
    // A scoped failing mock exercises the real claim/evaluate/persist failure path.
    // Normal retries use the unchanged configured producer and cannot repeat this fault.
    const failureProvider = new MockProvider({
      ok: false,
      reason: "api_error",
    });
    const result = failedStartingPoint
      ? await analyzeSession(db, session, {
          workflow,
          audit: {
            provider: failureProvider.id,
            model: failureProvider.model,
            ...promptMetadata,
          },
          explain: (input) => analyze(input, failureProvider, 30000),
        })
      : await runAnalysisForSession(db, session);
    if (
      result.status !== "RECORDED" ||
      result.workflowStatus !==
        (failedStartingPoint ? "ANALYSIS_FAILED" : "MEDICAL_REVIEW_PENDING")
    )
      throw new Error(
        "Prepared analysis did not reach its required starting point.",
      );
    if (stateId === "alex-plan-v1" || stateId === "daniel-plan-v1") {
      const analysis = (
        await datasetRepository(db, datasetId).list("analysis")
      ).find((item) => item.id === result.analysisId);
      if (!analysis) throw new Error("Prepared analysis is unavailable.");
      await recordReview(db, session, workspaceId(analysis), {
        expectedReviewVersion: 0,
        intent: "finalize",
        decisions: analysis.proposals.map((proposal) => ({
          proposalId: proposal.id,
          decision: stateId === "daniel-plan-v1" ? "MODIFY" : "APPROVE",
          reason:
            stateId === "daniel-plan-v1"
              ? "DEMONSTRATIVE — NOT CLINICALLY VALIDATED. Fictional demo reviewer wording clarifies the first-degree family-history opportunity for presentation only."
              : "DEMONSTRATIVE — NOT CLINICALLY VALIDATED. Fictional demo reviewer approval for presentation only.",
          revisedText:
            stateId === "daniel-plan-v1"
              ? "Discuss colorectal screening with your physician based on first-degree family history. Confirm your father's diagnosis history before deciding on screening."
              : null,
        })),
      });
    }
    await db.dataset.update({
      where: { id: datasetId },
      data: { scenarioId: stateId },
    });
  } catch (error) {
    // This invocation created the scope above; never clean up a refused existing scope.
    await db.dataset.deleteMany({ where: { id: datasetId } });
    throw error;
  }
}
