import "server-only";
import {
  buildFallbackScenarioState,
  getActiveLocalFallback,
} from "../clinical-review/service";
import { getDemoSession } from "../demo/session";
import { createDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { readPatientPlan } from "./reader";
import { getWorkflowStatus } from "../workflow/state";

export async function loadPatientPlan() {
  const session = await getDemoSession().catch(() => null);
  if (session && session.caseId !== "daniel-pitch") {
    const db = createDatabase();
    try {
      return await inDatasetTransaction(
        db,
        session.datasetId,
        async (repo, tx) =>
          readPatientPlan(
            repo,
            session.patientId,
            await getWorkflowStatus(tx, session.datasetId, session.patientId),
          ),
      );
    } finally {
      await db.$disconnect();
    }
  }

  const local =
    session?.caseId === "daniel-pitch"
      ? await buildFallbackScenarioState("daniel-pitch")
      : await getActiveLocalFallback();
  if (!local) return null;
  return {
    status: local.status,
    plan: local.plan,
    previous: false,
  };
}
