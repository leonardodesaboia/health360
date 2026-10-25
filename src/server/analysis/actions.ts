"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDemoSession } from "../demo/session";
import { getDatabase } from "../db/client";
import { runAnalysisForSession } from "./run";
import type { AnalysisServiceResult } from "./service";

export type AnalyzeActionResult =
  AnalysisServiceResult | { status: "NO_SESSION" | "UNAVAILABLE" };

/** Scope comes exclusively from the opaque demo cookie; this is not real authentication. */
export async function analyzeCurrentDemo(): Promise<AnalyzeActionResult> {
  try {
    const session = await getDemoSession();
    if (!session) return { status: "NO_SESSION" };
    const db = getDatabase();
    const result = await runAnalysisForSession(db, session);
    for (const path of [
      "/patient/analysis",
      "/patient",
      "/patient/profile",
      "/doctor",
    ])
      revalidatePath(path);
    return result;
  } catch {
    return { status: "UNAVAILABLE" };
  }
}

export async function analyzeAndShowStatus(): Promise<void> {
  const result = await analyzeCurrentDemo();
  const error =
    result.status === "UNAVAILABLE" ||
    result.status === "NOT_READY" ||
    result.status === "STALE";
  redirect(error ? "/patient/analysis?error=1" : "/patient/analysis");
}
