import { z } from "zod";
import {
  answersSchema,
  draftSchema,
  initialAnswers,
  type IntakeAnswers,
  type IntakeDraft,
} from "./contracts";
import {
  buildCompletedIntake,
  completedIntakeSchema,
  type CompletedIntake,
} from "./profile";

export type SubmitIntake = {
  answers: IntakeAnswers;
  expectedRevision: number;
  expectedProfileVersion: number;
  submissionId: string;
};
export interface IntakeDraftRepository {
  load(patientId: string): Promise<IntakeDraft | null>;
  save(
    patientId: string,
    answers: IntakeAnswers,
    step: number,
    expectedRevision: number,
  ): Promise<IntakeDraft>;
  submit(patientId: string, request: SubmitIntake): Promise<CompletedIntake>;
}
export interface HealthProfileRepository {
  latest(patientId: string): Promise<CompletedIntake | null>;
  history(patientId: string): Promise<CompletedIntake[]>;
}
export type DraftStorage = Pick<Storage, "getItem" | "setItem">;
const stateSchema = z.object({
  schemaVersion: z.literal(2),
  draft: draftSchema,
  completions: z.array(completedIntakeSchema),
});
/** Temporary synthetic browser storage. Server wiring requires a trusted session dataset and transaction. */
export function createDraftRepository(
  storage: DraftStorage,
): IntakeDraftRepository & HealthProfileRepository {
  const key = (patientId: string) =>
    `health360:intake:v1:${encodeURIComponent(patientId)}`;
  function read(patientId: string) {
    const raw = storage.getItem(key(patientId));
    if (raw === null) return null;
    const data: unknown = JSON.parse(raw);
    const legacy = z
      .object({
        schemaVersion: z.literal(1),
        answers: z.record(z.string(), z.string().nullable()),
      })
      .passthrough()
      .safeParse(data);
    const state = stateSchema.parse(
      legacy.success
        ? {
            schemaVersion: 2,
            draft: {
              ...legacy.data,
              answers: { ...initialAnswers, ...legacy.data.answers },
            },
            completions: [],
          }
        : data,
    );
    if (
      state.draft.patientId !== patientId ||
      state.completions.some(
        (entry) =>
          entry.profile.patientId !== patientId ||
          entry.intake.patientId !== patientId ||
          entry.examinations.some((exam) => exam.patientId !== patientId),
      )
    )
      throw new Error("Draft scope does not match.");
    return state;
  }
  function locked<T>(patientId: string, operation: () => T): Promise<T> {
    if (typeof window !== "undefined") {
      if (!navigator.locks)
        return Promise.reject(
          new Error("Browser storage locking is unavailable."),
        );
      return navigator.locks.request(key(patientId), operation);
    }
    // Unit tests / non-browser adapters: critical section is synchronous with one atomic setItem.
    return Promise.resolve().then(operation);
  }
  return {
    async load(patientId) {
      return read(patientId)?.draft ?? null;
    },
    async latest(patientId) {
      return read(patientId)?.completions.at(-1) ?? null;
    },
    async history(patientId) {
      return read(patientId)?.completions ?? [];
    },
    save(patientId, answers, step, expectedRevision) {
      return locked(patientId, () => {
        const current = read(patientId);
        if ((current?.draft.revision ?? 0) !== expectedRevision)
          throw new Error("A newer draft exists. Reload before saving.");
        const draft = draftSchema.parse({
          schemaVersion: 1,
          synthetic: true,
          validation: "demonstrative",
          patientId,
          revision: expectedRevision + 1,
          step,
          answers: answersSchema.parse(answers),
          updatedAt: new Date().toISOString(),
        });
        storage.setItem(
          key(patientId),
          JSON.stringify(
            stateSchema.parse({
              schemaVersion: 2,
              draft,
              completions: current?.completions ?? [],
            }),
          ),
        );
        return draft;
      });
    },
    submit(patientId, request) {
      return locked(patientId, () => {
        const {
          answers,
          expectedRevision,
          expectedProfileVersion,
          submissionId,
        } = request;
        z.string().min(1).max(120).parse(submissionId);
        const current = read(patientId);
        const existing = current?.completions.find(
          (entry) => entry.submissionId === submissionId,
        );
        const result = buildCompletedIntake(
          patientId,
          answers,
          existing?.profile.version ?? expectedProfileVersion + 1,
          submissionId,
          existing?.profile.updatedAt ?? new Date().toISOString(),
        );
        if (existing) {
          if (
            JSON.stringify(existing.intake.answers) !==
            JSON.stringify(result.intake.answers)
          )
            throw new Error(
              "Submission ID was already used for different answers.",
            );
          return existing;
        }
        if (
          !current ||
          current.draft.revision !== expectedRevision ||
          (current.completions.at(-1)?.profile.version ?? 0) !==
            expectedProfileVersion
        )
          throw new Error(
            "A newer draft or profile exists. Reload before confirming.",
          );
        const latest = current.completions.at(-1);
        if (
          latest &&
          JSON.stringify(latest.intake.answers) ===
            JSON.stringify(result.intake.answers)
        )
          return latest;
        const draft = {
          ...current.draft,
          revision: expectedRevision + 1,
          answers: answersSchema.parse(answers),
          updatedAt: result.profile.updatedAt,
        };
        storage.setItem(
          key(patientId),
          JSON.stringify(
            stateSchema.parse({
              schemaVersion: 2,
              draft,
              completions: [...current.completions, result],
            }),
          ),
        );
        return result;
      });
    },
  };
}
