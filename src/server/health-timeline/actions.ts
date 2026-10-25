"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getActiveLocalFallback,
  startLocalFallbackReassessment,
} from "../clinical-review/service";
import { getDemoSession } from "../demo/session";
import { createDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { beginReassessment } from "./reassessment";

export async function startReassessment(form: FormData) {
  let session = null;
  try {
    session = await getDemoSession();
  } catch {
    session = null;
  }

  if (!session) {
    const local = await getActiveLocalFallback();
    if (!local) redirect("/patient");
    await startLocalFallbackReassessment(local.caseId);
    revalidatePath("/patient/plan");
    revalidatePath("/patient/history");
    redirect("/patient/intake");
  }

  const db = createDatabase();
  let failed = false;
  try {
    await inDatasetTransaction(db, session.datasetId, (_repo, tx) =>
      beginReassessment(tx, session.datasetId, session.patientId, {
        planId: form.get("planId"),
        profileVersion: Number(form.get("profileVersion")),
      }),
    );
  } catch {
    failed = true;
  } finally {
    await db.$disconnect();
  }
  if (failed) redirect("/patient/history?update=unavailable");
  revalidatePath("/patient/plan");
  revalidatePath("/patient/history");
  redirect("/patient/intake");
}
