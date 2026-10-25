import "server-only";
import { getActiveLocalFallback } from "../clinical-review/service";
import { getDemoSession } from "../demo/session";
import { createDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { readPatientPlan } from "./reader";
import { getWorkflowStatus } from "../workflow/state";

export async function loadPatientPlan() {
  const session = await getDemoSession().catch(() => null);
  if (session) {
    const db = createDatabase();
    try {
      return await inDatasetTransaction(
        db,
        session.datasetId,
        async (repo, tx) =>
          readPatientPlan(
            repo,
            session.patientId,
            await getWorkflowStatus(
              tx,
              session.datasetId,
              session.patientId,
            ),
          ),
      );
    } finally {
      await db.$disconnect();
    }
  }

  const local = await getActiveLocalFallback();
  if (!local) return null;
  return {
    status: local.status,
    plan: local.plan,
    previous: false,
  };
}
