import "server-only";
import type { PrismaClient } from "../../generated/prisma/client";
import { datasetRepository } from "../db/repository";
import {
  answersSchema,
  fieldIds,
  initialAnswers,
} from "../../features/health-intake/contracts";

/** Restore only answers linked to the selected patient's latest immutable profile. */
export async function readIntakePrefill(
  db: PrismaClient,
  datasetId: string,
  patientId: string,
) {
  const repo = datasetRepository(db, datasetId);
  const profile = (await repo.list("profile"))
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => b.version - a.version)[0];
  const intake = (await repo.list("intake")).find(
    (i) => i.patientId === patientId && i.profileVersion === profile?.version,
  );
  const answers = { ...initialAnswers };
  for (const id of fieldIds) {
    const fact =
      profile?.intakeFacts?.[
        id as keyof NonNullable<typeof profile.intakeFacts>
      ];
    const recorded = intake?.answers[id];
    answers[id] = recorded
      ? recorded.value
      : id === "age"
        ? (profile?.age?.toString() ?? null)
        : typeof fact === "boolean"
          ? fact
            ? "yes"
            : "no"
          : id === "priorScreening" && typeof fact === "string"
            ? fact
            : null;
  }
  return {
    answers: answersSchema.parse(answers),
    profileVersion: profile?.version ?? 0,
  };
}
