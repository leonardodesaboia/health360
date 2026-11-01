import "server-only";

import {
  buildFallbackScenarioState,
  getActiveLocalFallback,
} from "../clinical-review/service";
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
    if (session?.caseId === "daniel-pitch") {
      const daniel = await buildFallbackScenarioState("daniel-pitch");
      return { status: daniel.status, unavailable: false };
    }
    if (session) {
      const db = getDatabase();
      const status = await getWorkflowStatus(
        db,
        session.datasetId,
        session.patientId,
      );
      return { status, unavailable: false };
    }
  } catch {
    const local = await getActiveLocalFallback();
    if (local) return { status: local.status, unavailable: false };
    return { status: null, unavailable: true };
  }

  const local = await getActiveLocalFallback();
  if (local) return { status: local.status, unavailable: false };
  return { status: null, unavailable: false };
}
