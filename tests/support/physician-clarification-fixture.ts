import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  initialAnswers,
  type IntakeAnswers,
} from "../../src/features/health-intake/contracts";
import { workspaceId } from "../../src/features/clinical-review/reader";
import { replaceDemoDataset } from "../../src/server/demo/store";
import { startIntake, completeIntake } from "../../src/server/intake/service";
import { runAnalysisForSession } from "../../src/server/analysis/run";
import { datasetRepository } from "../../src/server/db/repository";
import { recordReview } from "../../src/server/clinical-review/decisions";

export async function seedPhysicianReviewReady(
  db: PrismaClient,
  datasetId: string,
) {
  const session = {
    datasetId,
    patientId: "synthetic-first-screening",
    caseId: "first-screening" as const,
  };
  await replaceDemoDataset(db, datasetId, session.caseId);
  const answers = Object.fromEntries(
    Object.keys(initialAnswers).map((id) => [id, "no"]),
  ) as IntakeAnswers;
  Object.assign(answers, {
    age: "60",
    medications: "None",
    priorScreening: "NEVER_SCREENED",
  });
  await startIntake(db, datasetId, session.patientId);
  await completeIntake(
    db,
    datasetId,
    session.patientId,
    answers,
    crypto.randomUUID(),
  );
  await runAnalysisForSession(db, session);
  const repo = datasetRepository(db, datasetId);
  const analysis = (await repo.list("analysis")).sort(
    (a, b) => b.version - a.version,
  )[0];
  return { session, analysis, repo };
}

export async function seedPhysicianClarification(
  db: PrismaClient,
  datasetId: string,
  targetField?: "age",
) {
  const { session, analysis, repo } = await seedPhysicianReviewReady(
    db,
    datasetId,
  );
  const question = targetField
    ? "Please confirm your current age for this demo review."
    : "What would you like the demo reviewer to know about your follow-up?";
  const review = await recordReview(db, session, workspaceId(analysis), {
    expectedReviewVersion: 0,
    intent: "save",
    decisions: analysis.proposals.map((proposal) => ({
      proposalId: proposal.id,
      decision: "CLARIFY",
      reason: "",
      revisedText: null,
      clarification: { question, ...(targetField ? { targetField } : {}) },
    })),
  });
  return { session, analysis, review, question, repo };
}
