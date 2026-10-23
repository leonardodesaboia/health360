import "server-only";
import { buildPatientHistory } from "../../features/health-timeline/history";
import type { DatasetRepository } from "../db/repository";
import { readPatientPlan } from "../preventive-plan/reader";
import type { WorkflowStatus } from "../../features/workflow/workflow";

export async function readPatientHistory(
  repo: DatasetRepository,
  patientId: string,
  status: WorkflowStatus,
) {
  const [patients, profiles, intakes, analyses, reviews, plans, events] =
    await Promise.all([
      repo.list("patient"),
      repo.list("profile"),
      repo.list("intake"),
      repo.list("analysis"),
      repo.list("review"),
      repo.list("plan"),
      repo.list("event"),
    ]);
  if (!patients.some((p) => p.id === patientId && p.synthetic))
    throw new Error("Demo patient unavailable");
  const reviewed = await Promise.all(
    plans
      .filter((p) => p.patientId === patientId)
      .map((p) => readPatientPlan(repo, patientId, status, p.id)),
  );
  const safePlans = reviewed.flatMap((result) =>
    result.plan ? [result.plan] : [],
  );
  const history = buildPatientHistory(
    { profiles, intakes, analyses, reviews, plans: safePlans, events },
    patientId,
  );
  const latestProfileVersion = Math.max(
    0,
    ...profiles.filter((p) => p.patientId === patientId).map((p) => p.version),
  );
  return { ...history, status, latestProfileVersion };
}
