import "server-only";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Prisma } from "../../generated/prisma/client";
import { datasetRepository } from "../db/repository";
import { readPatientPlan } from "../preventive-plan/reader";
import { getWorkflowStatus, transitionWorkflow } from "../workflow/state";

export const reassessmentRequestSchema = z.object({
  planId: z.string().min(1).max(200),
  profileVersion: z.number().int().positive(),
});

/** The intake producer saves the next profile and invokes analysis after editing. */
export async function beginReassessment(
  tx: Prisma.TransactionClient,
  datasetId: string,
  patientId: string,
  input: unknown,
) {
  const request = reassessmentRequestSchema.parse(input);
  const status = await getWorkflowStatus(tx, datasetId, patientId);
  const repo = datasetRepository(tx, datasetId);
  const [profiles, plans] = await Promise.all([
    repo.list("profile"),
    repo.list("plan"),
  ]);
  const currentProfile = profiles
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => b.version - a.version)[0];
  const currentPlan = plans
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => b.version - a.version)[0];
  if (
    !currentPlan ||
    !currentProfile ||
    currentPlan.id !== request.planId ||
    currentProfile.version !== request.profileVersion ||
    currentPlan.profileVersion !== currentProfile.version
  )
    throw new Error(
      "A newer evaluation exists. Reload your history before updating information.",
    );
  const reviewed = await readPatientPlan(
    repo,
    patientId,
    status,
    currentPlan.id,
  );
  if (!reviewed.plan)
    throw new Error("A reviewed plan is required before reassessment.");
  if (status === "REASSESSMENT_PENDING" || status === "INTAKE_IN_PROGRESS")
    return;
  if (status !== "PLAN_AVAILABLE")
    throw new Error(
      "Finish the current evaluation before starting reassessment.",
    );
  await transitionWorkflow(tx, datasetId, {
    patientId,
    to: "REASSESSMENT_PENDING",
    expectedFrom: "PLAN_AVAILABLE",
    expectedRefs: {
      planId: currentPlan.id,
      profileVersion: currentProfile.version,
    },
    actor: "patient",
    refs: { planId: currentPlan.id, profileVersion: currentProfile.version },
    reason: "Patient started updating synthetic information for reassessment",
  });
  await repo.append("event", {
    id: randomUUID(),
    patientId,
    kind: "REASSESSMENT_REQUESTED",
    occurredAt: new Date().toISOString(),
    entityId: currentProfile.id,
    entityVersion: currentProfile.version,
    provenance: "PATIENT_REPORTED",
  });
}
