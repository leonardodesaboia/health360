"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { getDatabase } from "../db/client";
import { getDemoSession } from "../demo/session";
import { StaleStateError } from "../workflow/state";
import { resumeAnalysisForSession } from "../analysis/run";
import type { ClarificationActionResult } from "../../features/clarification/contracts";
import { saveClarificationAnswers } from "./service";

/** Resolves scope on the server and calls the analysis owner's exported continuation. */
export async function submitClarification(
  input: unknown,
): Promise<ClarificationActionResult> {
  let analysisFailed = false;
  let answersSaved = false;
  try {
    const session = await getDemoSession();
    if (!session) return { status: "NO_SESSION" };
    const db = getDatabase();
    await saveClarificationAnswers(
      db,
      session.datasetId,
      session.patientId,
      input,
    );
    answersSaved = true;
    const result = await resumeAnalysisForSession(db, session);
    analysisFailed =
      result.status !== "RECORDED" && result.status !== "EXISTING";
  } catch (cause) {
    if (answersSaved) revalidatePath("/patient/clarification");
    if (cause instanceof StaleStateError) return { status: "STALE" };
    if (cause instanceof ZodError) return { status: "INVALID" };
    return { status: "UNAVAILABLE" };
  }
  for (const path of [
    "/patient/clarification",
    "/patient/analysis",
    "/patient/profile",
    "/patient/history",
    "/patient/plan",
    "/patient",
  ])
    revalidatePath(path);
  redirect(analysisFailed ? "/patient/analysis?error=1" : "/patient/analysis");
}

/** Recovery after the atomic answer reservation succeeded but the call was interrupted. */
export async function continueSavedAnalysis(): Promise<void> {
  let unavailable = false;
  let session;
  try {
    session = await getDemoSession();
  } catch {
    redirect("/patient/analysis?error=1");
  }
  if (!session) redirect("/patient");
  try {
    const result = await resumeAnalysisForSession(getDatabase(), session);
    unavailable = result.status !== "RECORDED" && result.status !== "EXISTING";
  } catch {
    unavailable = true;
  }
  revalidatePath("/patient/clarification");
  revalidatePath("/patient/analysis");
  redirect(unavailable ? "/patient/analysis?error=1" : "/patient/analysis");
}
