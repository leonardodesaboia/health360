import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import {
  clinicalContextSchema,
  healthProfileSchema,
} from "../../src/features/patients/contracts";
import { createDatabase } from "../../src/server/db/client";
import {
  datasetRepository,
  inDatasetTransaction,
} from "../../src/server/db/repository";
import * as workflow from "../../src/server/workflow/state";
import { loadClinicalContext } from "../../src/server/clinical-rules/context";
import { scenarioVariant } from "../../src/server/clinical-rules/scenarios";
import { analyze } from "../../src/server/ai/analyze";
import { MockProvider } from "../../src/server/ai/provider/mock";
import type { AnalysisInput } from "../../src/server/ai/schemas/analysis";
import {
  analyzeSession,
  type AnalysisDependencies,
} from "../../src/server/analysis/service";

if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable PostgreSQL database",
  );
const db = createDatabase(process.env.TEST_DATABASE_URL);
const datasets: string[] = [];
const facts = {
  provenance: "PATIENT_REPORTED",
  rectalBleeding: false,
  bowelChange: false,
  weightLoss: false,
  colorectalCancer: false,
  polyps: false,
  ibd: false,
  hereditaryCancerSyndrome: false,
  serratedPolyposis: false,
  familyCrc: false,
  familySyndrome: false,
  priorScreening: "NEVER_SCREENED",
  colonoscopyNormal: null,
  colonoscopyComplete: null,
  colonoscopyAdequatePrep: null,
};

async function seed(unknownAge = false, unsupportedContext = false) {
  const datasetId = `analysis-test-${randomUUID()}`;
  datasets.push(datasetId);
  await db.dataset.create({ data: { id: datasetId } });
  const fixture = scenarioVariant("first-screening");
  const profile = healthProfileSchema.parse({
    ...fixture.profile,
    age: unknownAge ? null : fixture.profile.age,
    intakeFacts: facts,
  });
  const context = clinicalContextSchema.parse(
    loadClinicalContext("first-screening", 1),
  );
  if (unsupportedContext) context.evidence = [];
  await inDatasetTransaction(db, datasetId, async (repo, tx) => {
    await repo.append("patient", {
      id: profile.patientId,
      displayName: "Synthetic analysis test",
      synthetic: true,
      status: "NOT_STARTED",
    });
    await repo.append("profile", profile);
    await repo.append("context", context);
    await workflow.transitionWorkflow(tx, datasetId, {
      patientId: profile.patientId,
      expectedFrom: "NOT_STARTED",
      to: "INTAKE_IN_PROGRESS",
      actor: "patient",
    });
    await workflow.transitionWorkflow(tx, datasetId, {
      patientId: profile.patientId,
      expectedFrom: "INTAKE_IN_PROGRESS",
      to: "INTAKE_COMPLETED",
      actor: "patient",
      refs: { profileVersion: 1 },
    });
  });
  return {
    datasetId,
    patientId: profile.patientId,
    caseId: "first-screening" as const,
  };
}

function explain(input: AnalysisInput) {
  const data = {
    summary: "Synthetic preliminary explanation awaiting physician review.",
    relevantInformation: [],
    missingInformation: [],
    uncertainties: [],
    reviewQuestions: [],
    proposals: input.context.allowedProposals.map((finding) => ({
      category: finding.category,
      title: "Preliminary screening discussion",
      rationale:
        "Discuss the supplied deterministic screening finding with a physician.",
      ruleIds: [finding.ruleId],
      evidenceIds: finding.evidenceIds,
      consideredData: ["Supplied deterministic rule facts"],
      uncertainties: [],
    })),
  };
  return analyze(input, new MockProvider({ ok: true, data }), 1000);
}
const dependencies = (): AnalysisDependencies => ({
  workflow,
  explain: vi.fn(explain),
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

describe("PostgreSQL analysis orchestration", () => {
  it("persists immutable preliminary analysis, proposals, metadata and timeline atomically", async () => {
    const session = await seed();
    expect(await analyzeSession(db, session, dependencies())).toMatchObject({
      status: "RECORDED",
      workflowStatus: "MEDICAL_REVIEW_PENDING",
    });
    const repo = datasetRepository(db, session.datasetId);
    const analyses = await repo.list("analysis");
    expect(analyses).toHaveLength(1);
    expect(analyses[0]).toMatchObject({
      profileVersion: 1,
      contextVersion: 1,
      provider: "mock",
      promptVersion: 1,
      promptId: "synthetic-analysis",
      status: "PRELIMINARY",
    });
    expect(analyses[0].proposals).toHaveLength(1);
    expect((await repo.list("event"))[0]).toMatchObject({
      kind: "ANALYSIS_CREATED",
      entityId: analyses[0].id,
    });
    expect(await repo.list("review")).toEqual([]);
    expect(await repo.list("plan")).toEqual([]);
  });
  it("serializes simultaneous requests and never duplicates provider work or analysis", async () => {
    const session = await seed();
    const deps = dependencies();
    const results = await Promise.all([
      analyzeSession(db, session, deps),
      analyzeSession(db, session, deps),
    ]);
    expect(
      results.filter((result) => result.status === "RECORDED"),
    ).toHaveLength(1);
    expect(
      results.every((result) =>
        ["RECORDED", "BUSY", "EXISTING"].includes(result.status),
      ),
    ).toBe(true);
    expect(deps.explain).toHaveBeenCalledOnce();
    expect(
      await datasetRepository(db, session.datasetId).list("analysis"),
    ).toHaveLength(1);
  });
  it("keeps timeout history and retries through the legal workflow", async () => {
    const session = await seed();
    const deps = dependencies();
    deps.explain = async () => ({ status: "BLOCKED", reason: "timeout" });
    expect(await analyzeSession(db, session, deps)).toMatchObject({
      workflowStatus: "ANALYSIS_FAILED",
    });
    expect(await analyzeSession(db, session, dependencies())).toMatchObject({
      workflowStatus: "MEDICAL_REVIEW_PENDING",
    });
    const repo = datasetRepository(db, session.datasetId);
    const analyses = await repo.list("analysis");
    expect(analyses.map((record) => record.version).sort()).toEqual([1, 2]);
    expect(analyses.find((record) => record.version === 1)).toMatchObject({
      status: "BLOCKED",
      failureReason: "timeout",
      proposals: [],
    });
    expect((await repo.list("event")).map((event) => event.kind)).toEqual(
      expect.arrayContaining(["ANALYSIS_FAILED", "ANALYSIS_CREATED"]),
    );
  });
  it("blocks stale profile versions before any proposals are persisted", async () => {
    const session = await seed();
    const deps = dependencies();
    deps.explain = async (input) => {
      await inDatasetTransaction(db, session.datasetId, async (repo) => {
        const [profile] = await repo.list("profile");
        await repo.append("profile", {
          ...profile,
          id: randomUUID(),
          version: 2,
        });
      });
      return explain(input);
    };
    expect(await analyzeSession(db, session, deps)).toEqual({
      status: "STALE",
    });
    expect(
      await datasetRepository(db, session.datasetId).list("analysis"),
    ).toEqual([]);
    expect(
      await workflow.getWorkflowStatus(
        db,
        session.datasetId,
        session.patientId,
      ),
    ).toBe("ANALYSIS_FAILED");
  });
  it("does not complete a superseding reservation", async () => {
    const session = await seed();
    const deps = dependencies();
    deps.explain = async (input) => {
      await inDatasetTransaction(db, session.datasetId, async (_repo, tx) => {
        await workflow.transitionWorkflow(tx, session.datasetId, {
          patientId: session.patientId,
          expectedFrom: "ANALYSIS_PENDING",
          to: "ANALYSIS_FAILED",
          actor: "system",
        });
        await workflow.transitionWorkflow(tx, session.datasetId, {
          patientId: session.patientId,
          expectedFrom: "ANALYSIS_FAILED",
          to: "ANALYSIS_PENDING",
          actor: "system",
          refs: { analysisId: "superseding-request", profileVersion: 1 },
        });
      });
      return explain(input);
    };
    expect(await analyzeSession(db, session, deps)).toEqual({
      status: "STALE",
    });
    expect(
      await datasetRepository(db, session.datasetId).list("analysis"),
    ).toEqual([]);
    expect(
      await workflow.getWorkflowStatus(
        db,
        session.datasetId,
        session.patientId,
      ),
    ).toBe("ANALYSIS_PENDING");
  });
  it("isolates datasets with the same synthetic patient ID", async () => {
    const a = await seed();
    const b = await seed();
    await analyzeSession(db, a, dependencies());
    expect(await datasetRepository(db, b.datasetId).list("analysis")).toEqual(
      [],
    );
    expect(await workflow.getWorkflowStatus(db, b.datasetId, b.patientId)).toBe(
      "INTAKE_COMPLETED",
    );
  });
  it.each([
    [true, false, "CLARIFICATION_REQUIRED"],
    [false, true, "ANALYSIS_FAILED"],
  ] as const)(
    "fails closed for unknown age=%s unsupported evidence=%s",
    async (unknownAge, unsupportedContext, target) => {
      const session = await seed(unknownAge, unsupportedContext);
      const deps = dependencies();
      expect(await analyzeSession(db, session, deps)).toMatchObject({
        workflowStatus: target,
      });
      expect(deps.explain).not.toHaveBeenCalled();
      const [analysis] = await datasetRepository(db, session.datasetId).list(
        "analysis",
      );
      expect(analysis).toMatchObject({ status: "BLOCKED", proposals: [] });
    },
  );
});
