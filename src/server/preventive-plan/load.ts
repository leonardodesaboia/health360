import "server-only";
import { getDemoSession } from "../demo/session";
import { createDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { readPatientPlan } from "./reader";

export async function loadPatientPlan() {
  const session = await getDemoSession();
  if (!session) return null;
  const db = createDatabase();
  try {
    return await inDatasetTransaction(db, session.datasetId, (repo) =>
      readPatientPlan(repo, session.patientId),
    );
  } finally {
    await db.$disconnect();
  }
}
