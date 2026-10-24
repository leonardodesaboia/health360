import "server-only";
import { getDemoSession } from "../demo/session";
import { createDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { readPatientPlan } from "./reader";
import { getWorkflowStatus } from "../workflow/state";

export async function loadPatientPlan() {
  const session = await getDemoSession();
  if (!session) return null;
  const db = createDatabase();
  try {
    return await inDatasetTransaction(db, session.datasetId, async (repo, tx) =>
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
