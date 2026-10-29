import "server-only";
import { describeAnalysisOutcome } from "./outcome";
import { datasetRepository } from "../db/repository";
import { type AnalysisOutcome } from "../../features/workflow/outcome";

import { getDemoSession } from "../demo/session";
import { getDatabase } from "../db/client";
import { getWorkflowStatus } from "../workflow/state";
import type { WorkflowStatus } from "../../features/workflow/workflow";

/** Patient reader returns recorded status and safe outcome guidance, never preliminary proposals. */
export async function getAnalysisPageState(): Promise<{
  status: WorkflowStatus | null;
  unavailable: boolean;
  outcome?: AnalysisOutcome | null;
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
    const analyses =
      status === "ANALYSIS_FAILED" || status === "CLARIFICATION_REQUIRED"
        ? (await datasetRepository(db, session.datasetId).list("analysis"))
            .filter(
              (a) =>
                a.patientId === session.patientId &&
                a.profileVersion === session.profile.version,
            )
            .sort((a, b) => b.version - a.version)
        : [];
    return {
      status,
      unavailable: false,
      outcome: analyses[0]
        ? describeAnalysisOutcome(
            analyses[0],
            session.profile,
            session.examinations,
            session.clinicalContext,
          )
        : null,
    };
  } catch {
    return { status: null, unavailable: true };
  }
}
