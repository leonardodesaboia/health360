import "server-only";
import {
  buildQueue,
  findWorkspace,
  type ReviewRecords,
} from "../../features/clinical-review/reader";
import { getDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { getDemoSession } from "../demo/session";
import { getWorkflowStatus } from "../workflow/state";

async function readDataset() {
  const session = await getDemoSession();
  if (!session) return null;
  const db = getDatabase();
  return inDatasetTransaction(db, session.datasetId, async (repository, tx) => {
    // The shared state reader takes the patient lock before any versioned record reads.
    const workflowStatus = await getWorkflowStatus(
      tx,
      session.datasetId,
      session.patientId,
    );
    const [patients, profiles, examinations, analyses, contexts, reviews] =
      await Promise.all([
        repository.list("patient"),
        repository.list("profile"),
        repository.list("examination"),
        repository.list("analysis"),
        repository.list("context"),
        repository.list("review"),
      ]);
    const data: ReviewRecords = {
      contextDetails: session.clinicalContext,
      workflowStatus,
      patients,
      profiles,
      examinations,
      analyses,
      contexts,
      reviews,
    };
    return { session, data };
  });
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
