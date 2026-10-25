import "server-only";
import { getDemoSession } from "../demo/session";
import { getDatabase } from "../db/client";
import { readClarification } from "./service";

export async function loadCurrentClarification() {
  try {
    const session = await getDemoSession();
    if (!session) return { status: "NO_SESSION" as const };
    const form = await readClarification(
      getDatabase(),
      session.datasetId,
      session.patientId,
    );
    if (!form)
      return {
        status:
          session.patient.status === "ANALYSIS_PENDING"
            ? ("PENDING" as const)
            : ("NOT_REQUIRED" as const),
      };
    if (!form.available) return { status: "UNSUPPORTED" as const };
    return { status: "READY" as const, form };
  } catch {
    return { status: "UNAVAILABLE" as const };
  }
}
