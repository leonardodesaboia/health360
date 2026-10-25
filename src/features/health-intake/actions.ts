"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  getActiveLocalFallback,
  submitLocalFallbackIntake,
} from "@/server/clinical-review/service";
import { getDatabase } from "@/server/db/client";
import { getDemoSession } from "@/server/demo/session";
import { completeIntake, startIntake } from "@/server/intake/service";
import { StaleStateError } from "@/server/workflow/state";
import { answersSchema } from "./contracts";

export type IntakeActionResult =
  { status: "NO_SESSION" } | { status: "STARTED" } | { status: "STALE" };

/** Dataset scope always comes from the httpOnly demo session, never from the client. */
export async function startIntakeAction(): Promise<IntakeActionResult> {
  try {
    const session = await getDemoSession();
    if (!session) return { status: "NO_SESSION" };
    await startIntake(getDatabase(), session.datasetId, session.patientId);
    return { status: "STARTED" };
  } catch {
    return { status: "NO_SESSION" };
  }
}

export async function submitIntakeAction(
  answers: unknown,
  submissionId: unknown,
): Promise<IntakeActionResult> {
  let session = null;
  try {
    session = await getDemoSession();
  } catch {
    session = null;
  }
  if (!session) {
    const local = await getActiveLocalFallback();
    if (!local) return { status: "NO_SESSION" };
    await submitLocalFallbackIntake(
      local.caseId,
      answersSchema.parse(answers),
      z.uuid().parse(submissionId),
    );
    redirect("/patient/analysis");
  }
  try {
    await completeIntake(
      getDatabase(),
      session.datasetId,
      session.patientId,
      answers,
      z.uuid().parse(submissionId),
    );
  } catch (cause) {
    if (cause instanceof StaleStateError) return { status: "STALE" };
    throw cause;
  }
  redirect("/patient/analysis");
}
