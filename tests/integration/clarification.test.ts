import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, expect, it, vi } from "vitest";
import {
  initialAnswers,
  type IntakeAnswers,
} from "../../src/features/health-intake/contracts";
import { createDatabase } from "../../src/server/db/client";
import {
  datasetRepository,
  inDatasetTransaction,
} from "../../src/server/db/repository";
import { replaceDemoDataset } from "../../src/server/demo/store";
import { completeIntake, startIntake } from "../../src/server/intake/service";
import { analyzeSession } from "../../src/server/analysis/service";
import { resumePendingAnalysis } from "../../src/server/analysis/service";
import { resumeAnalysisForSession } from "../../src/server/analysis/run";
import * as workflow from "../../src/server/workflow/state";
import {
  readClarification,
  saveClarificationAnswers,
} from "../../src/server/clarification/service";

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
async function fixture() {
  const datasetId = `clarification-${randomUUID()}`;
  datasets.push(datasetId);
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
  await completeIntake(db, datasetId, session.patientId, answers, randomUUID());
  await analyzeSession(db, session, {
    workflow,
    audit: { provider: "mock", model: "mock", promptVersion: 1 },
    explain: async () => {
      throw new Error("Unknown age must not reach a provider");
    },
  });
  const form = await readClarification(db, datasetId, session.patientId);
  if (!form?.available) throw new Error("Expected current clarification form");
  return { session, form, repo: datasetRepository(db, datasetId) };
}
it("serializes concurrent answers so only one new version is saved", async () => {
  const { session, form, repo } = await fixture();
  const before = (await repo.list("profile")).length;
  const request = {
    profileVersion: form.profileVersion,
    analysisId: form.analysisId,
    answers: { age: "60" },
  };
  const results = await Promise.allSettled([
    saveClarificationAnswers(db, session.datasetId, session.patientId, request),
    saveClarificationAnswers(db, session.datasetId, session.patientId, request),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  expect(await repo.list("profile")).toHaveLength(before + 1);
  expect(
    (await repo.list("event")).filter(
      (e) => e.kind === "CLARIFICATION_ANSWERED",
    ),
  ).toHaveLength(1);
});
it("rejects invalid and unrelated answer patches without changing state or versions", async () => {
  const { session, form, repo } = await fixture();
  const before = await repo.list("profile");
  for (const answers of [
    { age: "invalid" },
    { age: "60", rectalBleeding: "no" },
    {},
  ]) {
    await expect(
      saveClarificationAnswers(db, session.datasetId, session.patientId, {
        profileVersion: form.profileVersion,
        analysisId: form.analysisId,
        answers,
      }),
    ).rejects.toThrow();
  }
  expect(await repo.list("profile")).toEqual(before);
  expect(
    await workflow.getWorkflowStatus(db, session.datasetId, session.patientId),
  ).toBe("CLARIFICATION_REQUIRED");
});
it("blocks unsupported analysis fields and leaves profile versions untouched", async () => {
  const { session, form, repo } = await fixture();
  const before = await repo.list("profile");
  const previous = (await repo.list("analysis"))[0];
  const unsupported = {
    ...previous,
    id: randomUUID(),
    version: previous.version + 1,
    missingInformation: ["unsupported.private.field"],
  };
  await inDatasetTransaction(db, session.datasetId, async (repository, tx) => {
    await workflow.transitionWorkflow(tx, session.datasetId, {
      patientId: session.patientId,
      expectedFrom: "CLARIFICATION_REQUIRED",
      to: "ANALYSIS_PENDING",
      actor: "system",
    });
    await repository.append("analysis", unsupported);
    await workflow.transitionWorkflow(tx, session.datasetId, {
      patientId: session.patientId,
      expectedFrom: "ANALYSIS_PENDING",
      to: "CLARIFICATION_REQUIRED",
      actor: "system",
      refs: { profileVersion: form.profileVersion, analysisId: unsupported.id },
    });
  });
  expect(
    await readClarification(db, session.datasetId, session.patientId),
  ).toEqual({ available: false });
  await expect(
    saveClarificationAnswers(db, session.datasetId, session.patientId, {
      profileVersion: form.profileVersion,
      analysisId: unsupported.id,
      answers: { age: "60" },
    }),
  ).rejects.toThrow("Unsupported");
  expect(await repo.list("profile")).toEqual(before);
  expect(await repo.list("plan")).toHaveLength(0);
});
it("appends immutable patient answers and atomically returns through pending, rejecting stale duplicate forms", async () => {
  const { session, form, repo } = await fixture();
  expect(form.questions.map((q) => q.id)).toEqual(["age"]);
  const before = await repo.list("profile");
  const analyses = await repo.list("analysis");
  const request = {
    profileVersion: form.profileVersion,
    analysisId: form.analysisId,
    answers: { age: "60" },
  };
  const result = await saveClarificationAnswers(
    db,
    session.datasetId,
    session.patientId,
    request,
  );
  expect(result.profileVersion).toBe(form.profileVersion + 1);
  expect(
    await workflow.getWorkflowStatus(db, session.datasetId, session.patientId),
  ).toBe("ANALYSIS_PENDING");
  const profiles = await repo.list("profile");
  for (const profile of before)
    expect(profiles.find((p) => p.id === profile.id)).toEqual(profile);
  expect(profiles.find((p) => p.version === result.profileVersion)?.age).toBe(
    60,
  );
  expect(await repo.list("analysis")).toEqual(analyses);
  expect(await repo.list("plan")).toHaveLength(0);
  await expect(
    saveClarificationAnswers(db, session.datasetId, session.patientId, request),
  ).rejects.toBeInstanceOf(workflow.StaleStateError);
  expect(await repo.list("profile")).toHaveLength(before.length + 1);
  const rerun = await resumeAnalysisForSession(db, session);
  expect(rerun).toMatchObject({
    status: "RECORDED",
    workflowStatus: "MEDICAL_REVIEW_PENDING",
  });
  expect(
    (await repo.list("analysis")).find((a) => a.id === result.reservationId)
      ?.profileVersion,
  ).toBe(result.profileVersion);
  expect(
    (await repo.list("analysis")).find((a) => a.id === analyses[0].id),
  ).toEqual(analyses[0]);
  expect(await repo.list("plan")).toHaveLength(0);
});
it("keeps I don't know null and refuses foreign analysis references without writes", async () => {
  const { session, form, repo } = await fixture();
  const count = (await repo.list("profile")).length;
  await expect(
    saveClarificationAnswers(db, session.datasetId, session.patientId, {
      profileVersion: form.profileVersion,
      analysisId: "foreign",
      answers: { age: "60" },
    }),
  ).rejects.toBeInstanceOf(workflow.StaleStateError);
  expect(await repo.list("profile")).toHaveLength(count);
  await saveClarificationAnswers(db, session.datasetId, session.patientId, {
    profileVersion: form.profileVersion,
    analysisId: form.analysisId,
    answers: { age: null },
  });
  const latest = (await repo.list("profile")).sort(
    (a, b) => b.version - a.version,
  )[0];
  expect(latest.age).toBeNull();
  expect(latest.missingInformation).toContain("Age in the synthetic scenario");
  expect(await resumeAnalysisForSession(db, session)).toMatchObject({
    status: "RECORDED",
    workflowStatus: "CLARIFICATION_REQUIRED",
  });
  expect(await repo.list("plan")).toHaveLength(0);
});

it("keeps saved answers and old analysis when reanalysis times out, with no plan", async () => {
  const { session, form, repo } = await fixture();
  const saved = await saveClarificationAnswers(
    db,
    session.datasetId,
    session.patientId,
    {
      profileVersion: form.profileVersion,
      analysisId: form.analysisId,
      answers: { age: "60" },
    },
  );
  const result = await resumePendingAnalysis(db, session, {
    workflow,
    audit: { provider: "mock", model: "timeout-test", promptVersion: 1 },
    explain: async () => ({ status: "BLOCKED", reason: "timeout" }),
  });
  expect(result).toMatchObject({
    status: "RECORDED",
    workflowStatus: "ANALYSIS_FAILED",
  });
  expect(
    (await repo.list("profile")).find((p) => p.version === saved.profileVersion)
      ?.age,
  ).toBe(60);
  expect(await repo.list("analysis")).toHaveLength(2);
  expect(await repo.list("plan")).toHaveLength(0);
});
