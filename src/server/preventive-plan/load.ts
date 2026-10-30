import "server-only";
import { getDemoSession } from "../demo/session";
import { getDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { readPatientPlan } from "./reader";
import { getWorkflowStatus } from "../workflow/state";

export async function loadPatientPlan() {
  const session = await getDemoSession();
  if (!session) return null;
  return inDatasetTransaction(
    getDatabase(),
    session.datasetId,
    async (repo, tx) =>
      readPatientPlan(
        repo,
        session.patientId,
        await getWorkflowStatus(tx, session.datasetId, session.patientId),
      ),
  );
}
