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
import { openReview } from "./decisions";

async function readDataset() {
  const session = await getDemoSession();
  if (!session) return null;
  const db = getDatabase();
  return inDatasetTransaction(db, session.datasetId, async (repository, tx) => {
    // The shared state reader takes the patient lock before any versioned record reads.
    let workflowStatus;
    try {
      workflowStatus = await getWorkflowStatus(
        tx,
        session.datasetId,
        session.patientId,
      );
    } catch (error) {
      // A demo case replacement can remove the cookie's patient; expose nothing then.
      const patients = await repository.list("patient").catch(() => null);
      if (patients?.some((patient) => patient.id === session.patientId) ?? true)
        throw error;
      return null;
    }
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

/** Opens the review (PENDING → IN_PROGRESS when current), then reads the workspace. */
export async function openReviewWorkspace(id: string) {
  const session = await getDemoSession();
  if (!session) return null;
  await openReview(getDatabase(), session, id);
  return getReviewWorkspace(id);
}
