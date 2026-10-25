import type { PrismaClient } from "../../src/generated/prisma/client";
import {
  initialAnswers,
  type IntakeAnswers,
} from "../../src/features/health-intake/contracts";
import { replaceDemoDataset } from "../../src/server/demo/store";
import { completeIntake, startIntake } from "../../src/server/intake/service";
import { analyzeSession } from "../../src/server/analysis/service";
import * as workflow from "../../src/server/workflow/state";
import { readClarification } from "../../src/server/clarification/service";

/** Synthetic Flow C setup; intake and initial analysis use the real producers. */
export async function seedClarification(db: PrismaClient, datasetId: string) {
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
    age: null,
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
  await analyzeSession(db, session, {
    workflow,
    audit: { provider: "mock", model: "mock", promptVersion: 1 },
    explain: async () => {
      throw new Error("Unknown age must not reach a provider");
    },
  });
  const form = await readClarification(db, datasetId, session.patientId);
  if (!form?.available) throw new Error("Expected current clarification form");
  return { session, form };
}
