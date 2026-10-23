"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDemoSession } from "../demo/session";
import { createDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { beginReassessment } from "./reassessment";

export async function startReassessment(form: FormData) {
  const session = await getDemoSession();
  if (!session) redirect("/patient");
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
