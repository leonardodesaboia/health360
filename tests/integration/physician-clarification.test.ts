import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, expect, it, vi } from "vitest";
import { createDatabase } from "../../src/server/db/client";
import {
  readClarification,
  saveClarificationAnswers,
} from "../../src/server/clarification/service";
import { resumeAnalysisForSession } from "../../src/server/analysis/run";
import { openReview } from "../../src/server/clinical-review/decisions";
import { listOpenClarificationRequests } from "../../src/server/clinical-review/clarifications";
import { workspaceId } from "../../src/features/clinical-review/reader";
import {
  getWorkflowStatus,
  StaleStateError,
} from "../../src/server/workflow/state";
import { seedPhysicianClarification } from "../support/physician-clarification-fixture";

if (!process.env.TEST_DATABASE_URL)
  throw new Error("Disposable test database required");
const db = createDatabase(process.env.TEST_DATABASE_URL);
const datasets: string[] = [];
vi.stubEnv("LLM_PROVIDER", "mock");
afterAll(async () => {
  await db.dataset.deleteMany({ where: { id: { in: datasets } } });
  await db.$disconnect();
  vi.unstubAllEnvs();
});
async function fixture(target?: "age") {
  const id = `physician-patient-${randomUUID()}`;
  datasets.push(id);
  const context = await seedPhysicianClarification(db, id, target);
  const form = await readClarification(db, id, context.session.patientId);
  if (!form?.available) throw new Error("Physician questions unavailable");
  return { ...context, form };
}
for (const target of ["age", undefined] as const)
  it(`routes ${target ?? "free-text"} physician clarification through reanalysis and a fresh review`, async () => {
    const { session, form, review, analysis, repo, question } =
      await fixture(target);
    const before = await repo.list("profile");
    expect(form.reviewId).toBe(review.id);
    const request = {
      profileVersion: form.profileVersion,
      analysisId: form.analysisId,
      reviewId: form.reviewId,
      reviewVersion: form.reviewVersion,
      answers: target ? { age: "61" } : {},
      freeAnswers: target
        ? {}
        : {
            [form.freeQuestions[0].id]:
              "I would like to discuss the next steps at the demo review.",
          },
    };
    expect(target ? form.questions[0].label : form.freeQuestions[0].label).toBe(
      question,
    );
    await expect(
      saveClarificationAnswers(db, session.datasetId, session.patientId, {
        ...request,
        reviewVersion: review.version + 1,
      }),
    ).rejects.toBeInstanceOf(StaleStateError);
    await saveClarificationAnswers(
      db,
      session.datasetId,
      session.patientId,
      request,
    );
    const next = (await repo.list("profile")).sort(
      (a, b) => b.version - a.version,
    )[0];
    expect(next.version).toBe(form.profileVersion + 1);
    expect(next.age).toBe(target ? 61 : 60);
    expect(
      next.personalHistory.some(
        (entry) =>
          entry.provenance === "PATIENT_REPORTED" &&
          entry.value?.includes("next steps"),
      ),
    ).toBe(!target);
    for (const old of before)
      expect((await repo.list("profile")).find((p) => p.id === old.id)).toEqual(
        old,
      );
    expect(await resumeAnalysisForSession(db, session)).toMatchObject({
      status: "RECORDED",
      workflowStatus: "MEDICAL_REVIEW_PENDING",
    });
    const latest = (await repo.list("analysis")).sort(
      (a, b) => b.version - a.version,
    )[0];
    expect(latest.id).not.toBe(analysis.id);
    expect(latest.profileVersion).toBe(next.version);
    expect(
      await listOpenClarificationRequests(
        db,
        session.datasetId,
        session.patientId,
      ),
    ).toEqual([]);
    expect(await openReview(db, session, workspaceId(latest))).toBe(true);
    expect(
      await getWorkflowStatus(db, session.datasetId, session.patientId),
    ).toBe("MEDICAL_REVIEW_IN_PROGRESS");
    expect((await repo.list("review")).find((r) => r.id === review.id)).toEqual(
      review,
    );
    expect(review.completedAt).toBeNull();
    expect(await repo.list("plan")).toEqual([]);
  });
it("preserves an unknown free-text response as patient-reported null", async () => {
  const { session, form, repo } = await fixture();
  await saveClarificationAnswers(db, session.datasetId, session.patientId, {
    profileVersion: form.profileVersion,
    analysisId: form.analysisId,
    reviewId: form.reviewId,
    reviewVersion: form.reviewVersion,
    answers: {},
    freeAnswers: { [form.freeQuestions[0].id]: null },
  });
  const intake = (await repo.list("intake")).sort(
    (a, b) => b.profileVersion - a.profileVersion,
  )[0];
  expect(
    Object.entries(intake.answers)
      .filter(
        ([key]) =>
          key.startsWith("physician-clarification/") && key.endsWith("/answer"),
      )
      .map(([, value]) => value),
  ).toEqual([{ value: null, provenance: "PATIENT_REPORTED" }]);
  expect(await repo.list("plan")).toEqual([]);
});
