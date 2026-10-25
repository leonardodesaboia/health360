"use server";

import "server-only";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { analyzeCurrentDemo } from "../analysis/actions";
import { getDatabase } from "../db/client";
import { demoCaseIdSchema, type DemoCaseId } from "../demo/contracts";
import { getDemoSession, selectDemoCaseForSession } from "../demo/session";
import { completeIntake, startIntake } from "../intake/service";
import { getWorkflowStatus } from "../workflow/state";
import {
  baselineAnswersForCase,
  buildFallbackScenarioState,
  LOCAL_DEMO_COOKIE,
  recordLocalFallbackReview,
  recordPhysicianReview,
  resolveClarificationCycle,
  submitReviewInputSchema,
  type SubmitReviewResult,
} from "./service";

export async function prepareScenarioAnalysisForReviewAction(
  requestedCaseId?: DemoCaseId,
): Promise<{
  ok: boolean;
  analysisId?: string;
}> {
  const targetCase: DemoCaseId =
    requestedCaseId && demoCaseIdSchema.safeParse(requestedCaseId).success
      ? requestedCaseId
      : "repeat-screening";

  try {
    let session = await getDemoSession();
    if (!session || (requestedCaseId && session.caseId !== requestedCaseId)) {
      await selectDemoCaseForSession(targetCase);
      session = await getDemoSession();
    }
    if (session) {
      const db = getDatabase();
      const status = await getWorkflowStatus(
        db,
        session.datasetId,
        session.patientId,
      );
      if (
        status === "NOT_STARTED" ||
        status === "INTAKE_IN_PROGRESS" ||
        status === "REASSESSMENT_PENDING"
      ) {
        await startIntake(db, session.datasetId, session.patientId);
        await completeIntake(
          db,
          session.datasetId,
          session.patientId,
          baselineAnswersForCase(session.caseId),
          randomUUID(),
        );
      }
      const result = await analyzeCurrentDemo();
      for (const path of [
        "/doctor",
        "/patient",
        "/patient/analysis",
        "/patient/profile",
      ]) {
        revalidatePath(path);
      }
      if (result.status === "RECORDED" || result.status === "EXISTING") {
        return { ok: true, analysisId: result.analysisId };
      }
    }
  } catch {
    // Fall back to in-memory scenario evaluation when local PostgreSQL is not running.
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCAL_DEMO_COOKIE, targetCase, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  const local = await buildFallbackScenarioState(targetCase);
  for (const path of [
    "/doctor",
    "/patient",
    "/patient/plan",
    "/patient/history",
  ]) {
    revalidatePath(path);
  }
  return { ok: true, analysisId: local.analysis.id };
}

export async function submitClarificationAction(
  resolution: "PROVIDE_DATA" | "KEEP_UNKNOWN",
  providedValue?: string,
) {
  let session = null;
  try {
    session = await getDemoSession();
  } catch {
    session = null;
  }
  const result = await resolveClarificationCycle(
    session,
    resolution,
    providedValue,
  );
  if (session && resolution === "PROVIDE_DATA") {
    try {
      await analyzeCurrentDemo();
    } catch {
      // Ignored if local fallback handled it
    }
  }
  for (const path of [
    "/patient/analysis",
    "/patient",
    "/patient/profile",
    "/patient/history",
    "/doctor",
  ]) {
    revalidatePath(path);
  }
  return result;
}

export async function submitMedicalReviewAction(
  rawInput: unknown,
): Promise<SubmitReviewResult> {
  const parsed = submitReviewInputSchema.safeParse(rawInput);
  if (
    parsed.success &&
    (parsed.data.analysisId === "scenario-repeat-screening" ||
      parsed.data.analysisId === "scenario-first-screening")
  ) {
    const caseId: DemoCaseId =
      parsed.data.analysisId === "scenario-repeat-screening"
        ? "repeat-screening"
        : "first-screening";
    const cookieStore = await cookies();
    cookieStore.set(LOCAL_DEMO_COOKIE, caseId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    const result = await recordLocalFallbackReview(caseId, rawInput);
    for (const path of [
      "/doctor",
      "/patient",
      "/patient/plan",
      "/patient/history",
    ]) {
      revalidatePath(path);
    }
    return result;
  }

  try {
    const session = await getDemoSession();
    if (!session) {
      return {
        status: "NO_SESSION",
        message: "Select a demonstration case before recording a review.",
      };
    }
    const result = await recordPhysicianReview(session, rawInput);
    for (const path of [
      "/doctor",
      "/patient",
      "/patient/plan",
      "/patient/history",
      "/patient/analysis",
    ]) {
      revalidatePath(path);
    }
    return result;
  } catch {
    return {
      status: "INVALID",
      message: "Review could not be saved. Verify storage connectivity.",
    };
  }
}
