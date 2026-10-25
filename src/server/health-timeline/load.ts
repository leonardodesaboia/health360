import "server-only";
import { getActiveLocalFallback } from "../clinical-review/service";
import { getDemoSession } from "../demo/session";
import { createDatabase } from "../db/client";
import { inDatasetTransaction } from "../db/repository";
import { readPatientHistory } from "./reader";
import { readPatientPlan } from "../preventive-plan/reader";
import { getWorkflowStatus } from "../workflow/state";

export async function loadPatientHistory() {
  try {
    const session = await getDemoSession();
    if (session) {
      const db = createDatabase();
      try {
        return await inDatasetTransaction(
          db,
          session.datasetId,
          async (repo, tx) =>
            readPatientHistory(
              repo,
              session.patientId,
              await getWorkflowStatus(
                tx,
                session.datasetId,
                session.patientId,
              ),
            ),
        );
      } finally {
        await db.$disconnect();
      }
    }
  } catch {
    // Fall back to local scenario state when PostgreSQL is offline.
  }

  const local = await getActiveLocalFallback();
  if (!local) return null;
  const plansHistory =
    local.plansHistory ?? (local.plan ? [local.plan] : []);
  const eventsHistory = local.eventsHistory ?? [];
  return {
    status: local.status,
    latestProfileVersion: local.profile.version,
    plans: plansHistory.map((p) => ({
      id: p.id,
      version: p.version,
      publishedAt: p.publishedAt,
      profileVersion: p.profileVersion,
      reviewVersion: p.reviewVersion,
      previousPlanId: p.previousPlanId,
    })),
    events: [...eventsHistory].reverse(),
  };
}

export async function loadHistoricalPlan(planId: string) {
  try {
    const session = await getDemoSession();
    if (session) {
      const db = createDatabase();
      try {
        return await inDatasetTransaction(
          db,
          session.datasetId,
          async (repo, tx) =>
            readPatientPlan(
              repo,
              session.patientId,
              await getWorkflowStatus(
                tx,
                session.datasetId,
                session.patientId,
              ),
              planId,
            ),
        );
      } finally {
        await db.$disconnect();
      }
    }
  } catch {
    // Fall back to local scenario state when PostgreSQL is offline.
  }

  const local = await getActiveLocalFallback();
  if (!local) return null;
  const plansHistory =
    local.plansHistory ?? (local.plan ? [local.plan] : []);
  const plan = plansHistory.find((p) => p.id === planId) ?? null;
  if (!plan) return null;
  return {
    status: local.status,
    plan,
    previous:
      local.status !== "PLAN_AVAILABLE" ||
      local.profile.version !== plan.profileVersion ||
      plansHistory[0]?.id !== plan.id,
  };
}
