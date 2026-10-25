import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { initialAnswers } from "../../src/features/health-intake/contracts";
import { buildCompletedIntake } from "../../src/features/health-intake/profile";
import { recommendationProposalSchema } from "../../src/features/patients/contracts";
import { analyze } from "../../src/server/ai/analyze";
import { MockProvider } from "../../src/server/ai/provider/mock";
import type { AnalysisInput } from "../../src/server/ai/schemas/analysis";
import { runAnalysisForSession } from "../../src/server/analysis/run";
import { analyzeSession } from "../../src/server/analysis/service";
import { createDatabase } from "../../src/server/db/client";
import {
  datasetRepository,
  inDatasetTransaction,
} from "../../src/server/db/repository";
import { replaceDemoDataset } from "../../src/server/demo/store";
import { completeIntake, startIntake } from "../../src/server/intake/service";
import { readPatientPlan } from "../../src/server/preventive-plan/reader";
import * as workflow from "../../src/server/workflow/state";

if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable PostgreSQL database",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const datasets: string[] = [];
const patientId = "synthetic-repeat-screening";
// Jordan: age 60, average risk, normal complete adequately prepared colonoscopy in 2022.
const jordan: typeof initialAnswers = {
  ...(Object.fromEntries(
    Object.keys(initialAnswers).map((id) => [id, null]),
  ) as typeof initialAnswers),
  age: "60",
  rectalBleeding: "no",
  bowelChange: "no",
  weightLoss: "no",
  colorectalCancer: "no",
  polyps: "no",
  ibd: "no",
  hereditaryCancerSyndrome: "no",
  serratedPolyposis: "no",
  familyCrc: "no",
  familySyndrome: "no",
  medications: "None",
  smoking: "no",
  activity: "yes",
  priorScreening: "COLONOSCOPY",
  examDatePrecision: "EXACT",
  examDate: "2022-11-03",
  colonoscopyNormal: "yes",
  colonoscopyComplete: "yes",
  colonoscopyAdequatePrep: "yes",
};

async function completedRepeatScreening(answers: typeof initialAnswers) {
  const datasetId = `do-not-test-${randomUUID()}`;
  datasets.push(datasetId);
  await replaceDemoDataset(db, datasetId, "repeat-screening");
  await startIntake(db, datasetId, patientId);
  await completeIntake(db, datasetId, patientId, answers, randomUUID());
  return { datasetId, patientId, caseId: "repeat-screening" as const };
}
const dependencies = () => ({
  workflow,
  // The default mock provider echoes only the allowed deterministic proposals.
  explain: (input: AnalysisInput) => analyze(input, new MockProvider(), 1000),
  audit: {
    provider: "mock",
    model: "deterministic-v1",
    promptVersion: 1,
    promptId: "synthetic-analysis",
  },
  now: () => new Date("2026-11-03T12:00:00Z"),
});

afterAll(async () => {
  await db.dataset.deleteMany({ where: { id: { in: datasets } } });
  await db.$disconnect();
});

describe("Do Not Test flow through the proposal stage", () => {
  it("persists a traceable preliminary possible-redundancy proposal for Jordan", async () => {
    const session = await completedRepeatScreening(jordan);
    expect(await analyzeSession(db, session, dependencies())).toMatchObject({
      status: "RECORDED",
      workflowStatus: "MEDICAL_REVIEW_PENDING",
    });

    const repo = datasetRepository(db, session.datasetId);
    const [analysis] = await repo.list("analysis");
    expect(analysis).toMatchObject({ status: "PRELIMINARY", provider: "mock" });
    const rows = await db.recommendationProposal.findMany({
      where: { datasetId: session.datasetId },
    });
    expect(rows).toHaveLength(1);
    const proposal = recommendationProposalSchema.parse(rows[0].payload);
    expect(proposal).toMatchObject({
      category: "POSSIBLE_REDUNDANCY",
      ruleIds: ["crc-routine-repeat"],
      ruleReferences: [
        {
          ruleId: "crc-routine-repeat",
          ruleVersion: 1,
          evidenceVersion: 1,
          validation: "demonstrative",
        },
      ],
    });
    const [context] = await repo.list("context");
    expect(proposal.evidenceIds.length).toBeGreaterThan(0);
    for (const evidenceId of proposal.evidenceIds)
      expect(context.evidence.map((source) => source.id)).toContain(evidenceId);
    expect(proposal.consideredData).toEqual(
      expect.arrayContaining([
        "Age: 60",
        expect.stringMatching(/^Examination: Colonoscopy; date: 2022-11-03/),
      ]),
    );
    expect(proposal.uncertainties).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "A recent test alone does not establish redundancy",
        ),
      ]),
    );

    // Preliminary until physician review: nothing reaches the patient plan.
    expect(await repo.list("review")).toEqual([]);
    expect(await repo.list("plan")).toEqual([]);
    expect(
      await readPatientPlan(repo, patientId, "MEDICAL_REVIEW_PENDING"),
    ).toEqual({ status: "MEDICAL_REVIEW_PENDING", plan: null });
  });

  it("routes an unknown colonoscopy date to clarification without proposals", async () => {
    const session = await completedRepeatScreening({
      ...jordan,
      // "I don't know" is an explicit null answer.
      examDatePrecision: null,
      examDate: null,
    });
    expect(await analyzeSession(db, session, dependencies())).toMatchObject({
      workflowStatus: "CLARIFICATION_REQUIRED",
    });
    expect(
      await db.recommendationProposal.count({
        where: { datasetId: session.datasetId },
      }),
    ).toBe(0);
  });

  it("re-runs from CLARIFICATION_REQUIRED through runAnalysisForSession after a new profile version", async () => {
    process.env.LLM_PROVIDER = "mock";
    const session = await completedRepeatScreening({
      ...jordan,
      examDatePrecision: null,
      examDate: null,
    });
    expect(await runAnalysisForSession(db, session)).toMatchObject({
      workflowStatus: "CLARIFICATION_REQUIRED",
    });
    // Simulate the clarification answer: the next immutable profile version with the date.
    await inDatasetTransaction(db, session.datasetId, async (repo) => {
      const versions = (await repo.list("profile"))
        .filter((profile) => profile.patientId === patientId)
        .map((profile) => profile.version);
      const completed = buildCompletedIntake(
        patientId,
        jordan,
        Math.max(...versions) + 1,
        randomUUID(),
        new Date().toISOString(),
      );
      for (const exam of completed.examinations)
        await repo.append("examination", exam);
      await repo.append("profile", completed.profile);
    });
    expect(await runAnalysisForSession(db, session)).toMatchObject({
      status: "RECORDED",
      workflowStatus: "MEDICAL_REVIEW_PENDING",
    });
    const analyses = await datasetRepository(db, session.datasetId).list(
      "analysis",
    );
    expect(analyses.map((analysis) => analysis.status)).toEqual(
      expect.arrayContaining(["BLOCKED", "PRELIMINARY"]),
    );
    const latest = analyses.find(
      (analysis) => analysis.status === "PRELIMINARY",
    );
    expect(latest?.proposals.map((proposal) => proposal.category)).toEqual([
      "POSSIBLE_REDUNDANCY",
    ]);
  });
});
