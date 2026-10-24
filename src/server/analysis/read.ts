import "server-only";

import { getDemoSession } from "../demo/session";
import { getDatabase } from "../db/client";
import { getWorkflowStatus } from "../workflow/state";
import type { WorkflowStatus } from "../../features/workflow/workflow";

/** Patient reader returns administrative status only, never preliminary proposal content. */
export async function getAnalysisPageState(): Promise<{
  status: WorkflowStatus | null;
  unavailable: boolean;
}> {
  try {
    const session = await getDemoSession();
    if (!session) return { status: null, unavailable: false };
    const db = getDatabase();
    const status = await getWorkflowStatus(
      db,
      session.datasetId,
      session.patientId,
    );
    return { status, unavailable: false };
  } catch {
    return { status: null, unavailable: true };
  }
}
