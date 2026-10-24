"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDatabase } from "@/server/db/client";
import { getDemoSession } from "@/server/demo/session";
import { completeIntake, startIntake } from "@/server/intake/service";
import { StaleStateError } from "@/server/workflow/state";

export type IntakeActionResult =
  { status: "NO_SESSION" } | { status: "STARTED" } | { status: "STALE" };

/** Dataset scope always comes from the httpOnly demo session, never from the client. */
export async function startIntakeAction(): Promise<IntakeActionResult> {
  const session = await getDemoSession();
  if (!session) return { status: "NO_SESSION" };
  await startIntake(getDatabase(), session.datasetId, session.patientId);
  return { status: "STARTED" };
}

export async function submitIntakeAction(
  answers: unknown,
  submissionId: unknown,
): Promise<IntakeActionResult> {
  const session = await getDemoSession();
  if (!session) return { status: "NO_SESSION" };
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
