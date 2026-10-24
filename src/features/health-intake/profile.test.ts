import { describe, expect, it } from "vitest";
import { initialAnswers, intakeSchema } from "./contracts";
import { buildCompletedIntake, formatExaminationDate } from "./profile";
import { createDraftRepository } from "./repository";

const unknowns = () =>
  Object.fromEntries(
    Object.keys(initialAnswers).map((id) => [id, null]),
  ) as typeof initialAnswers;
describe("confirmed synthetic profile", () => {
  it("preserves typed unknowns, date/result gaps and reported provenance", () => {
    const result = buildCompletedIntake(
      "synthetic",
      { ...unknowns(), age: "52", priorScreening: "COLONOSCOPY" },
      1,
      "submission",
      "2026-10-23T00:00:00Z",
    );
    expect(result.profile.age).toBe(52);
    expect(result.profile.intakeFacts?.rectalBleeding).toBeNull();
    expect(result.profile.intakeFacts?.provenance).toBe("PATIENT_REPORTED");
    expect(result.examinations[0].performedAt).toBeNull();
    expect(result.examinations[0].result.value).toBeNull();
    expect(result.profile.missingInformation).toContain(
      "Previous examination date",
    );
    expect(result.intake.completedAt).toBe("2026-10-23T00:00:00Z");
  });
  it("keeps approximate dates separate and validates conditional dates", () => {
    const answers = {
      ...unknowns(),
      priorScreening: "COLONOSCOPY",
      examDatePrecision: "APPROXIMATE",
      examApproximateDate: "2020-06",
    };
    const result = buildCompletedIntake(
      "synthetic",
      answers,
      1,
      "submission",
      "2026-10-23T00:00:00Z",
    );
    expect(result.examinations[0].performedAt).toBeNull();
    expect(result.examinations[0].approximateDate).toBe("2020-06");
    expect(formatExaminationDate(null, "2020-06")).toBe(
      "Approximate: Jun 2020",
    );
    expect(
      intakeSchema.safeParse({ ...answers, examApproximateDate: "2020-99" })
        .success,
    ).toBe(false);
    expect(
      intakeSchema.safeParse({
        ...answers,
        examDatePrecision: "EXACT",
        examDate: "2020-02-31",
      }).success,
    ).toBe(false);
  });
  it("creates immutable versions atomically and deduplicates retries", async () => {
    const values = new Map<string, string>();
    const repo = createDraftRepository({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
    });
    const answers = unknowns();
    const draft = await repo.save("synthetic", answers, 4, 0);
    const request = {
      answers,
      expectedRevision: draft.revision,
      expectedProfileVersion: 0,
      submissionId: "one",
    };
    const first = await repo.submit("synthetic", request);
    expect(await repo.submit("synthetic", request)).toEqual(first);
    await expect(
      repo.submit("synthetic", { ...request, submissionId: "stale" }),
    ).rejects.toThrow(/newer|stale/i);
    expect(
      await repo.submit("synthetic", {
        ...request,
        expectedRevision: draft.revision + 1,
        expectedProfileVersion: 1,
        submissionId: "unchanged-retry",
      }),
    ).toEqual(first);
    const next = await repo.save(
      "synthetic",
      { ...answers, age: "53" },
      4,
      draft.revision + 1,
    );
    await repo.submit("synthetic", {
      ...request,
      answers: next.answers,
      expectedRevision: next.revision,
      expectedProfileVersion: 1,
      submissionId: "two",
    });
    expect(
      (await repo.history("synthetic")).map((entry) => entry.profile.version),
    ).toEqual([1, 2]);
    expect((await repo.latest("synthetic"))?.profile.age).toBe(53);
    expect(first.profile.age).toBeNull();
    expect(await repo.latest("another-patient")).toBeNull();
  });
  it("rejects concurrent stale edits and leaves storage unchanged on failed completion", async () => {
    let raw: string | null = null;
    let fail = false;
    const repo = createDraftRepository({
      getItem: () => raw,
      setItem: (_key, value) => {
        if (fail) throw new Error("Unavailable");
        raw = value;
      },
    });
    const answers = unknowns();
    const writes = await Promise.allSettled([
      repo.save("synthetic", answers, 4, 0),
      repo.save("synthetic", answers, 4, 0),
    ]);
    expect(
      writes.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const before = raw;
    fail = true;
    await expect(
      repo.submit("synthetic", {
        answers,
        expectedRevision: 1,
        expectedProfileVersion: 0,
        submissionId: "one",
      }),
    ).rejects.toThrow("Unavailable");
    expect(raw).toBe(before);
    expect(await repo.latest("synthetic")).toBeNull();
  });
  it("migrates a first-slice draft without inventing new answers", async () => {
    const oldAnswers = {
      age: "52",
      rectalBleeding: null,
      bowelChange: "no",
      weightLoss: "no",
      colorectalCancer: "no",
      polyps: "no",
      ibd: "no",
      familyCrc: null,
      familySyndrome: "no",
      historyDetails: "",
    };
    const raw = JSON.stringify({
      schemaVersion: 1,
      synthetic: true,
      validation: "demonstrative",
      patientId: "synthetic",
      revision: 1,
      step: 1,
      answers: oldAnswers,
      updatedAt: "2026-10-23T00:00:00Z",
    });
    const repo = createDraftRepository({
      getItem: () => raw,
      setItem: () => {
        throw new Error("Load must not write");
      },
    });
    const restored = await repo.load("synthetic");
    expect(restored?.answers.familyCrc).toBeNull();
    expect(restored?.answers.hereditaryCancerSyndrome).toBe("");
    expect(restored?.answers.priorScreening).toBe("");
  });
  it("never infers an exam or negative quality facts from no previous screening", () => {
    const result = buildCompletedIntake(
      "synthetic",
      {
        ...unknowns(),
        priorScreening: "NEVER_SCREENED",
        colonoscopyNormal: "yes",
        examDate: "2020-01-01",
      },
      1,
      "submission",
      "2026-10-23T00:00:00Z",
    );
    expect(result.examinations).toEqual([]);
    expect(result.profile.intakeFacts?.colonoscopyNormal).toBeNull();
    expect(result.profile.intakeFacts?.priorScreening).toBe("NEVER_SCREENED");
  });
  it("projects declared true and false facts without changing unknowns", () => {
    const result = buildCompletedIntake(
      "synthetic",
      {
        ...unknowns(),
        priorScreening: "COLONOSCOPY",
        examDatePrecision: "EXACT",
        examDate: "2022-04-18",
        rectalBleeding: "no",
        familyCrc: "yes",
        colonoscopyNormal: "yes",
        colonoscopyComplete: "no",
      },
      1,
      "positive",
      "2026-10-23T00:00:00Z",
    );
    expect(result.profile.intakeFacts?.rectalBleeding).toBe(false);
    expect(result.profile.intakeFacts?.familyCrc).toBe(true);
    expect(result.profile.intakeFacts?.colonoscopyNormal).toBe(true);
    expect(result.profile.intakeFacts?.colonoscopyComplete).toBe(false);
    expect(result.profile.intakeFacts?.colonoscopyAdequatePrep).toBeNull();
    expect(result.examinations[0].performedAt).toBe("2022-04-18");
    expect(formatExaminationDate("2022-04-18")).toBe("Apr 18, 2022");
  });
  it("rejects changed answers reusing an existing submission ID", async () => {
    let raw: string | null = null;
    const repo = createDraftRepository({
      getItem: () => raw,
      setItem: (_key, value) => {
        raw = value;
      },
    });
    const answers = unknowns();
    await repo.save("synthetic", answers, 4, 0);
    const request = {
      answers,
      expectedRevision: 1,
      expectedProfileVersion: 0,
      submissionId: "one",
    };
    await repo.submit("synthetic", request);
    await expect(
      repo.submit("synthetic", {
        ...request,
        answers: { ...answers, age: "60" },
      }),
    ).rejects.toThrow(/different answers/);
    expect(await repo.history("synthetic")).toHaveLength(1);
  });
  it("allows only one completion for concurrently confirmed stale revisions", async () => {
    let raw: string | null = null;
    const repo = createDraftRepository({
      getItem: () => raw,
      setItem: (_key, value) => {
        raw = value;
      },
    });
    const answers = unknowns();
    await repo.save("synthetic", answers, 4, 0);
    const request = {
      answers,
      expectedRevision: 1,
      expectedProfileVersion: 0,
      submissionId: "one",
    };
    const attempts = await Promise.allSettled([
      repo.submit("synthetic", request),
      repo.submit("synthetic", { ...request, submissionId: "two" }),
    ]);
    expect(
      attempts.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(await repo.history("synthetic")).toHaveLength(1);
  });
});
