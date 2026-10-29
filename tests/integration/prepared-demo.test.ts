import "dotenv/config";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createDatabase } from "../../src/server/db/client";
import { datasetRepository } from "../../src/server/db/repository";
import { demoDatasetId } from "../../src/server/demo/records";
import {
  getDemoSession,
  resetDemoSession,
  selectDemoCaseForSession,
} from "../../src/server/demo/session";
import { getReviewQueue } from "../../src/server/clinical-review/reader";
import { readPatientPlan } from "../../src/server/preventive-plan/reader";
import { runAnalysisForSession } from "../../src/server/analysis/run";
import { getWorkflowStatus } from "../../src/server/workflow/state";
import { canTransition } from "../../src/features/workflow/workflow";
import * as intakeProducer from "../../src/server/intake/service";
import * as demoRecords from "../../src/server/demo/records";
import { readIntakePrefill } from "../../src/server/intake/read";

const sessionMocks = vi.hoisted(() => ({
  token: undefined as string | undefined,
  database: vi.fn(),
  set: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (sessionMocks.token ? { value: sessionMocks.token } : undefined),
    set: sessionMocks.set,
  }),
}));
vi.mock("../../src/server/db/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/server/db/client")>()),
  getDatabase: sessionMocks.database,
}));

if (!process.env.TEST_DATABASE_URL)
  throw new Error("TEST_DATABASE_URL must name a disposable database");
const db = createDatabase(process.env.TEST_DATABASE_URL);
const datasets = new Set<string>();
const preparedStates = [
  [
    "alex-review",
    "first-screening",
    "MEDICAL_REVIEW_PENDING",
    "PREVENTIVE_OPPORTUNITY",
  ],
  [
    "jordan-review",
    "repeat-screening",
    "MEDICAL_REVIEW_PENDING",
    "POSSIBLE_REDUNDANCY",
  ],
  [
    "alex-plan-v1",
    "first-screening",
    "PLAN_AVAILABLE",
    "PREVENTIVE_OPPORTUNITY",
  ],
  ["alex-analysis-failed", "first-screening", "ANALYSIS_FAILED", null],
  [
    "daniel-review",
    "family-history-screening",
    "MEDICAL_REVIEW_PENDING",
    "PREVENTIVE_OPPORTUNITY",
  ],
  [
    "daniel-plan-v1",
    "family-history-screening",
    "PLAN_AVAILABLE",
    "PREVENTIVE_OPPORTUNITY",
  ],
] as const;

beforeEach(() => {
  vi.stubEnv("LLM_PROVIDER", "mock");
  vi.stubEnv("LLM_MODEL", "deterministic-v1");
  vi.stubEnv("LLM_TIMEOUT_MS", "30000");
  vi.stubEnv("OPENAI_API_KEY", "");
  sessionMocks.token = undefined;
  sessionMocks.database.mockReturnValue(db);
  sessionMocks.set.mockImplementation((_name: string, value: string) => {
    sessionMocks.token = value;
    datasets.add(demoDatasetId(value));
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
afterAll(async () => {
  await db.dataset.deleteMany({ where: { id: { in: [...datasets] } } });
  await db.$disconnect();
});

describe("producer-built presentation starting points", () => {
  it("restores Daniel's numeric diagnosis age from typed seed facts before intake exists", async () => {
    await selectDemoCaseForSession("family-history-screening");
    const session = (await getDemoSession())!;
    const prefill = await readIntakePrefill(
      db,
      session.datasetId,
      session.patientId,
    );
    expect(prefill.answers.familyCrc).toBe("yes");
    expect(prefill.answers.familyCrcFirstDegree).toBe("yes");
    expect(prefill.answers.familyCrcDiagnosisAge).toBe("50");
    expect(
      await datasetRepository(db, session.datasetId).list("intake"),
    ).toEqual([]);
  });
  it.each(preparedStates)(
    "prepares %s with real records and a legal history",
    async (stateId, caseId, status, category) => {
      await selectDemoCaseForSession(stateId);
      const session = (await getDemoSession())!;
      expect(session).not.toBeNull();
      expect(session.caseId).toBe(caseId);
      expect(session.patient.status).toBe(status);
      expect(session.patient.synthetic).toBe(true);
      expect(session.clinicalContext.label).toBe(
        "DEMONSTRATIVE — NOT CLINICALLY VALIDATED",
      );
      const repo = datasetRepository(db, session.datasetId);
      const history = await repo.list("workflowTransition");
      expect(history.map((item) => item.to)).toEqual([
        "INTAKE_IN_PROGRESS",
        "INTAKE_COMPLETED",
        "ANALYSIS_PENDING",
        status === "ANALYSIS_FAILED"
          ? "ANALYSIS_FAILED"
          : "MEDICAL_REVIEW_PENDING",
        ...(status === "PLAN_AVAILABLE"
          ? [
              "MEDICAL_REVIEW_IN_PROGRESS",
              "MEDICAL_REVIEW_COMPLETED",
              "PLAN_AVAILABLE",
            ]
          : []),
      ]);
      for (const [index, item] of history.entries()) {
        expect(item.version).toBe(index + 1);
        expect(item.from).toBe(
          index === 0 ? "NOT_STARTED" : history[index - 1].to,
        );
        expect(canTransition(item.from, item.to)).toBe(true);
      }
      const intakes = await repo.list("intake");
      expect(intakes).toHaveLength(1);
      expect(session.profile.version).toBe(2);
      expect(intakes[0].profileVersion).toBe(session.profile.version);
      expect(session.profile.missingInformation).toEqual([]);
      const [analysis] = await repo.list("analysis");
      expect(analysis.provider).toBe("mock");
      expect(analysis.profileVersion).toBe(session.profile.version);
      expect(analysis.summary).toContain(
        "DEMONSTRATIVE — NOT CLINICALLY VALIDATED",
      );
      const events = await repo.list("event");
      expect(events).toContainEqual(
        expect.objectContaining({
          kind:
            status === "ANALYSIS_FAILED"
              ? "ANALYSIS_FAILED"
              : "ANALYSIS_CREATED",
          entityId: analysis.id,
          entityVersion: analysis.version,
        }),
      );
      if (category) {
        expect(analysis.status).toBe("PRELIMINARY");
        expect(analysis.proposals.map((proposal) => proposal.category)).toEqual(
          [category],
        );
        if (caseId === "family-history-screening") {
          expect(analysis.proposals[0].ruleIds).toEqual([
            "crc-family-history-early-start",
          ]);
          expect(analysis.proposals[0].evidenceIds).toEqual([
            "usmstf-crc-family-history-2017",
          ]);
          expect(analysis.proposals[0].rationale).toContain(
            "first-degree family history",
          );
        }
      } else {
        expect(analysis.status).toBe("BLOCKED");
        expect(analysis.proposals).toEqual([]);
      }
      const plans = await repo.list("plan");
      const reviews = await repo.list("review");
      if (status === "PLAN_AVAILABLE") {
        expect(plans).toHaveLength(1);
        expect(plans[0].version).toBe(1);
        expect(reviews).toHaveLength(1);
        expect(reviews[0].completedAt).not.toBeNull();
        expect(
          reviews[0].decisions.every(
            (decision) =>
              decision.decision ===
              (stateId === "daniel-plan-v1" ? "MODIFY" : "APPROVE"),
          ),
        ).toBe(true);
        expect(reviews[0].reviewerId).toBe("demo-physician");
        expect(events).toContainEqual(
          expect.objectContaining({
            kind: "REVIEW_COMPLETED",
            entityId: reviews[0].id,
          }),
        );
        expect(events).toContainEqual(
          expect.objectContaining({
            kind: "PLAN_PUBLISHED",
            entityId: plans[0].id,
          }),
        );
        const screen = await readPatientPlan(
          repo,
          session.patientId,
          session.patient.status,
        );
        expect(screen.plan?.id).toBe(plans[0].id);
        expect(screen.previous).toBe(false);
      } else {
        expect(plans).toEqual([]);
        expect(reviews).toEqual([]);
        const queue = await getReviewQueue();
        expect(queue).toHaveLength(1);
        expect(queue[0].workflowStatus).toBe(status);
        expect(queue[0].analysis.id).toBe(analysis.id);
        expect(queue[0].stale).toBe(false);
      }
    },
    60000,
  );

  it("retains the real failure when retry produces a successful mock analysis", async () => {
    await selectDemoCaseForSession("alex-analysis-failed");
    const session = (await getDemoSession())!;
    expect(await runAnalysisForSession(db, session)).toMatchObject({
      status: "RECORDED",
      workflowStatus: "MEDICAL_REVIEW_PENDING",
    });
    const repo = datasetRepository(db, session.datasetId);
    const analyses = (await repo.list("analysis")).sort(
      (a, b) => a.version - b.version,
    );
    expect(analyses.map((item) => item.status)).toEqual([
      "BLOCKED",
      "PRELIMINARY",
    ]);
    expect(analyses[0]).toMatchObject({
      provider: "mock",
      model: "deterministic-v1",
      failureReason: "api_error",
      proposals: [],
      missingInformation: [],
      profileVersion: session.profile.version,
    });
    expect(analyses[1].profileVersion).toBe(analyses[0].profileVersion);
    expect(analyses[1].proposals.map((proposal) => proposal.category)).toEqual([
      "PREVENTIVE_OPPORTUNITY",
    ]);
    expect(
      (await repo.list("event")).filter(
        (event) => event.kind === "ANALYSIS_FAILED",
      ),
    ).toEqual([
      expect.objectContaining({
        entityId: analyses[0].id,
        entityVersion: analyses[0].version,
        provenance: "RULE_GENERATED",
      }),
    ]);
    expect(
      (await repo.list("workflowTransition"))
        .slice(-2)
        .map((item) => [item.from, item.to]),
    ).toEqual([
      ["ANALYSIS_FAILED", "ANALYSIS_PENDING"],
      ["ANALYSIS_PENDING", "MEDICAL_REVIEW_PENDING"],
    ]);
    expect(await repo.list("plan")).toEqual([]);
  }, 60000);

  it("rebuilds a prepared point in fresh scope while preserving another browser", async () => {
    await selectDemoCaseForSession("alex-plan-v1");
    const otherToken = sessionMocks.token;
    const other = (await getDemoSession())!;
    await selectDemoCaseForSession("jordan-review");
    const before = (await getDemoSession())!;
    expect(await resetDemoSession()).toBe(true);
    const reset = (await getDemoSession())!;
    expect(reset.datasetId).not.toBe(before.datasetId);
    expect(reset.patient.status).toBe("MEDICAL_REVIEW_PENDING");
    expect(reset.caseId).toBe("repeat-screening");
    sessionMocks.token = otherToken;
    expect((await getDemoSession())?.datasetId).toBe(other.datasetId);
    expect(await getWorkflowStatus(db, other.datasetId, other.patientId)).toBe(
      "PLAN_AVAILABLE",
    );
  }, 60000);

  it("leaves the active cookie and records intact when a producer fails", async () => {
    await selectDemoCaseForSession("first-screening");
    const previous = (await getDemoSession())!;
    const count = await db.dataset.count();
    vi.spyOn(intakeProducer, "completeIntake").mockRejectedValueOnce(
      new Error("Injected producer failure"),
    );
    await expect(selectDemoCaseForSession("alex-review")).rejects.toThrow(
      "Injected producer failure",
    );
    expect((await getDemoSession())?.datasetId).toBe(previous.datasetId);
    expect(await db.dataset.count()).toBe(count);
  });

  it("rejects prepared points under an explicit live provider before writing", async () => {
    vi.stubEnv("LLM_PROVIDER", "openai");
    const count = await db.dataset.count();
    await expect(selectDemoCaseForSession("alex-review")).rejects.toThrow(
      /mock/i,
    );
    expect(await db.dataset.count()).toBe(count);
    expect(sessionMocks.token).toBeUndefined();
  });

  it("never cleans up a dataset that preparation refused to create", async () => {
    await selectDemoCaseForSession("first-screening");
    const previous = (await getDemoSession())!;
    vi.spyOn(demoRecords, "newDemoSessionToken").mockReturnValueOnce(
      sessionMocks.token!,
    );
    await expect(selectDemoCaseForSession("alex-review")).rejects.toThrow(
      "fresh dataset",
    );
    expect((await getDemoSession())?.datasetId).toBe(previous.datasetId);
    expect(
      await datasetRepository(db, previous.datasetId).list("profile"),
    ).toEqual([previous.profile]);
  });

  it("removes only the new completed preparation when cookie activation fails", async () => {
    await selectDemoCaseForSession("first-screening");
    const previous = (await getDemoSession())!;
    const count = await db.dataset.count();
    sessionMocks.set.mockImplementationOnce(() => {
      throw new Error("Cookie activation unavailable");
    });
    await expect(selectDemoCaseForSession("alex-plan-v1")).rejects.toThrow(
      "Cookie activation unavailable",
    );
    expect((await getDemoSession())?.datasetId).toBe(previous.datasetId);
    expect(await db.dataset.count()).toBe(count);
  }, 60000);
});
