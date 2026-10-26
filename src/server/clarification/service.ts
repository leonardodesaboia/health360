import "server-only";
import { randomUUID } from "node:crypto";
import { clarificationRequestSchema } from "../../features/clarification/contracts";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { buildCompletedIntake } from "../../features/health-intake/profile";
import {
  applyAnswers,
  applyRequestedAnswers,
  selectQuestions,
} from "../../features/clarification/questions";
import { datasetRepository, inDatasetTransaction } from "../db/repository";
import { readIntakePrefill } from "../intake/read";
import { listOpenClarificationRequests } from "../clinical-review/clarifications";
import { selectPhysicianQuestions } from "../../features/clarification/physician-questions";
import {
  getWorkflowState,
  StaleStateError,
  transitionWorkflow,
} from "../workflow/state";

const latest = <T extends { version: number }>(records: T[]) =>
  records.sort((a, b) => b.version - a.version)[0];

async function currentClarification(
  tx: Prisma.TransactionClient,
  datasetId: string,
  patientId: string,
) {
  const state = await getWorkflowState(tx, datasetId, patientId);
  if (state.status !== "CLARIFICATION_REQUIRED") return null;
  const repo = datasetRepository(tx, datasetId);
  const profile = latest(
    (await repo.list("profile")).filter((p) => p.patientId === patientId),
  );
  const analysis = latest(
    (await repo.list("analysis")).filter((a) => a.patientId === patientId),
  );
  if (
    !profile ||
    !analysis ||
    analysis.profileVersion !== profile.version ||
    state.lastTransition?.refs?.analysisId !== analysis.id ||
    state.lastTransition.refs.profileVersion !== profile.version
  )
    throw new StaleStateError();
  const prefill = await readIntakePrefill(tx, datasetId, patientId);
  const physicianRequests = await listOpenClarificationRequests(
    tx,
    datasetId,
    patientId,
  );
  if (physicianRequests.length) {
    if (
      physicianRequests.some(
        (request) =>
          request.analysisId !== analysis.id ||
          request.analysisVersion !== analysis.version,
      )
    )
      throw new StaleStateError();
    const selected = selectPhysicianQuestions(physicianRequests);
    return {
      unavailable: false as const,
      origin: "PHYSICIAN" as const,
      profile,
      analysis,
      answers: prefill.answers,
      ...selected,
      reviewId: physicianRequests[0].reviewId,
      reviewVersion: physicianRequests[0].reviewVersion,
    };
  }
  if (
    analysis.failureReason !== "missing_information" ||
    analysis.status !== "BLOCKED"
  )
    return { unavailable: true as const };
  const selected = selectQuestions(
    analysis.missingInformation,
    prefill.answers,
  );
  return {
    unavailable: false as const,
    origin: "ANALYSIS" as const,
    profile,
    analysis,
    answers: prefill.answers,
    ...selected,
    freeQuestions: [],
    bindings: [],
    reviewId: undefined,
    reviewVersion: undefined,
  };
}

export async function readClarification(
  db: PrismaClient,
  datasetId: string,
  patientId: string,
) {
  return inDatasetTransaction(db, datasetId, async (_repo, tx) => {
    const current = await currentClarification(tx, datasetId, patientId);
    if (!current) return null;
    if (current.unavailable) return { available: false as const };
    if (
      current.unsupported.length ||
      (!current.questions.length && !current.freeQuestions.length)
    )
      return { available: false as const };
    return {
      available: true as const,
      profileVersion: current.profile.version,
      analysisId: current.analysis.id,
      answers: current.answers,
      questions: current.questions,
      freeQuestions: current.freeQuestions,
      reviewId: current.reviewId,
      reviewVersion: current.reviewVersion,
    };
  });
}

/** Atomic patient answer/version update and reservation; analysis remains owned by its service. */
export async function saveClarificationAnswers(
  db: PrismaClient,
  datasetId: string,
  patientId: string,
  input: unknown,
) {
  const request = clarificationRequestSchema.parse(input);
  return inDatasetTransaction(db, datasetId, async (repo, tx) => {
    const current = await currentClarification(tx, datasetId, patientId);
    if (
      !current ||
      current.unavailable ||
      request.profileVersion !== current.profile.version ||
      request.analysisId !== current.analysis.id
    )
      throw new StaleStateError();
    if (
      request.reviewId !== current.reviewId ||
      request.reviewVersion !== current.reviewVersion
    )
      throw new StaleStateError();
    if (current.unsupported.length)
      throw new Error("Unsupported clarification request");
    const freeAnswers = request.freeAnswers ?? {};
    if (
      Object.keys(freeAnswers).length !== current.freeQuestions.length ||
      current.freeQuestions.some((q) => !Object.hasOwn(freeAnswers, q.id))
    )
      throw new Error("Answer only the requested questions");
    const answers =
      current.origin === "PHYSICIAN"
        ? applyRequestedAnswers(
            current.answers,
            current.questions,
            request.answers,
          )
        : applyAnswers(
            current.answers,
            current.analysis.missingInformation,
            request.answers,
          );
    const completed = buildCompletedIntake(
      patientId,
      answers,
      current.profile.version + 1,
      randomUUID(),
      new Date().toISOString(),
    );
    // Keep physician question context separate from patient-reported answers.
    // These sourced notes stay local; the analysis minimizer excludes profile free text.
    const previousIntake = (await repo.list("intake")).find(
      (i) =>
        i.patientId === patientId &&
        i.profileVersion === current.profile.version,
    );
    const notes = Object.fromEntries(
      Object.entries(previousIntake?.answers ?? {}).filter(([key]) =>
        key.startsWith("physician-clarification/"),
      ),
    );
    if (current.origin === "PHYSICIAN")
      for (const binding of current.bindings) {
        const key = `physician-clarification/${encodeURIComponent(current.reviewId)}/${current.reviewVersion}/${encodeURIComponent(binding.proposalId)}`;
        notes[`${key}/question`] = {
          value: `Demo reviewer follow-up question: ${binding.question}`,
          provenance: "SYSTEM_STRUCTURED",
        };
        notes[`${key}/answer`] = {
          value: binding.freeText
            ? freeAnswers[binding.answerId]
            : answers[binding.answerId as keyof typeof answers],
          provenance: "PATIENT_REPORTED",
        };
      }
    Object.assign(completed.intake.answers, notes);
    completed.profile.personalHistory.push(...Object.values(notes));
    const reservationId = randomUUID();
    await transitionWorkflow(tx, datasetId, {
      patientId,
      expectedFrom: "CLARIFICATION_REQUIRED",
      expectedRefs: {
        analysisId: current.analysis.id,
        profileVersion: current.profile.version,
      },
      to: "ANALYSIS_PENDING",
      actor: "patient",
      reason: "Complementary synthetic answers saved for a fresh analysis",
      refs: {
        profileVersion: completed.profile.version,
        analysisId: reservationId,
      },
    });
    for (const examination of completed.examinations)
      await repo.append("examination", examination);
    await repo.append("profile", completed.profile);
    await repo.append("intake", completed.intake);
    for (const kind of ["PROFILE_UPDATED", "CLARIFICATION_ANSWERED"] as const)
      await repo.append("event", {
        id: randomUUID(),
        patientId,
        kind,
        occurredAt: completed.profile.updatedAt,
        entityId: completed.profile.id,
        entityVersion: completed.profile.version,
        provenance: "PATIENT_REPORTED",
      });
    return { profileVersion: completed.profile.version, reservationId };
  });
}
