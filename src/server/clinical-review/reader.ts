import "server-only";
import {
  buildQueue,
  findWorkspace,
  type ReviewRecords,
} from "../../features/clinical-review/reader";
import { createDatabase } from "../db/client";
import { datasetRepository } from "../db/repository";
import { getDemoSession } from "../demo/session";
import { getWorkflowStatus } from "../workflow/state";

async function readDataset() {
  const session = await getDemoSession();
  if (!session) return null;
  const db = createDatabase();
  try {
    const repository = datasetRepository(db, session.datasetId);
    const [patients, profiles, examinations, analyses, contexts, reviews] =
      await Promise.all([
        repository.list("patient"),
        repository.list("profile"),
        repository.list("examination"),
        repository.list("analysis"),
        repository.list("context"),
        repository.list("review"),
      ]);
    const workflowStatus = await getWorkflowStatus(
      db,
      session.datasetId,
      session.patientId,
    );
    const data: ReviewRecords = {
      workflowStatus,
      patients,
      profiles,
      examinations,
      analyses,
      contexts,
      reviews,
    };
    return { session, data };
  } finally {
    await db.$disconnect();
  }
}

export async function getReviewQueue() {
  const result = await readDataset();
  return result ? buildQueue(result.data, result.session.patientId) : [];
}

export async function getReviewWorkspace(id: string) {
  const result = await readDataset();
  return result
    ? findWorkspace(result.data, result.session.patientId, id)
    : null;
}
