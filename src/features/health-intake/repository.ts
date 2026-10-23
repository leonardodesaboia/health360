import {
  answersSchema,
  draftSchema,
  type IntakeAnswers,
  type IntakeDraft,
} from "./contracts";

export interface IntakeDraftRepository {
  load(patientId: string): Promise<IntakeDraft | null>;
  save(
    patientId: string,
    answers: IntakeAnswers,
    step: number,
    expectedRevision: number,
  ): Promise<IntakeDraft>;
}
export type DraftStorage = Pick<Storage, "getItem" | "setItem">;
/** Synthetic browser-only adapter. Server adapters must enforce ownership and transactions. */
export function createDraftRepository(
  storage: DraftStorage,
): IntakeDraftRepository {
  const key = (patientId: string) =>
    `health360:intake:v1:${encodeURIComponent(patientId)}`;
  function read(patientId: string) {
    const raw = storage.getItem(key(patientId));
    if (raw === null) return null;
    const draft = draftSchema.parse(JSON.parse(raw));
    if (draft.patientId !== patientId)
      throw new Error("Draft scope does not match.");
    return draft;
  }
  return {
    async load(patientId) {
      return read(patientId);
    },
    async save(patientId, answers, step, expectedRevision) {
      const current = read(patientId);
      if ((current?.revision ?? 0) !== expectedRevision)
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
      storage.setItem(key(patientId), JSON.stringify(draft));
      return draft;
    },
  };
}
