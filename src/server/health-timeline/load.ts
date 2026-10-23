import "server-only";
import { getDemoSession } from "../demo/session";
import { createDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { readPatientHistory } from "./reader";
import { readPatientPlan } from "../preventive-plan/reader";
import { getWorkflowStatus } from "../workflow/state";

export async function loadPatientHistory() {
  const session = await getDemoSession();
  if (!session) return null;
  const db = createDatabase();
  try {
    return await inDatasetTransaction(db, session.datasetId, async (repo, tx) =>
      readPatientHistory(
        repo,
        session.patientId,
        await getWorkflowStatus(tx, session.datasetId, session.patientId),
      ),
    );
  } finally {
    await db.$disconnect();
  }
}

export async function loadHistoricalPlan(planId: string) {
  const session = await getDemoSession();
  if (!session) return null;
  const db = createDatabase();
  try {
    return await inDatasetTransaction(db, session.datasetId, async (repo, tx) =>
      readPatientPlan(
        repo,
        session.patientId,
        await getWorkflowStatus(tx, session.datasetId, session.patientId),
        planId,
      ),
    );
  } finally {
    await db.$disconnect();
  }
}
