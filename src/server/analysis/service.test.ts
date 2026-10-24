import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../../generated/prisma/client";
import type { RecordKind, Records } from "../db/records";
import { clinicalContextSchema } from "../../features/patients/contracts";
import {
  transition,
  type WorkflowStatus,
} from "../../features/workflow/workflow";
import { loadClinicalContext } from "../clinical-rules/context";
import { scenarioVariant } from "../clinical-rules/scenarios";
import { evaluateScreening } from "../clinical-rules/evaluate";
import { analyzeSession, type AnalysisDependencies } from "./service";

const storage = vi.hoisted(() => ({
  records: {} as { [K in RecordKind]: Records[K][] },
  status: "INTAKE_COMPLETED" as WorkflowStatus,
  scopes: [] as string[],
  failEvent: false,
}));
vi.mock("../db/repository", () => ({
  inDatasetTransaction: async (
    _db: unknown,
    datasetId: string,
    operation: (repo: unknown, tx: unknown) => Promise<unknown>,
  ) => {
    storage.scopes.push(datasetId);
    const original = structuredClone(storage.records);
    const originalStatus = storage.status;
    try {
      return await operation(
        {
          list: async (kind: RecordKind) =>
            structuredClone(storage.records[kind] ?? []),
          append: async (kind: RecordKind, value: Records[RecordKind]) => {
            if (kind === "event" && storage.failEvent)
              throw new Error("event write failed");
            (storage.records[kind] as Records[RecordKind][]).push(
              structuredClone(value),
            );
          },
        },
        {},
      );
    } catch (error) {
      storage.records = original;
      storage.status = originalStatus;
      throw error;
    }
  },
}));
const db = {} as PrismaClient;
const session = {
  datasetId: "dataset-a",
  patientId: "synthetic-first-screening",
  caseId: "first-screening" as const,
};
const completeFacts = {
  provenance: "PATIENT_REPORTED" as const,
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
  priorScreening: "NEVER_SCREENED" as const,
  colonoscopyNormal: null,
  colonoscopyComplete: null,
  colonoscopyAdequatePrep: null,
};
function dependencies() {
  const input = scenarioVariant("first-screening");
  const finding = evaluateScreening(input).findings[0];
  return {
    workflow: {
      getWorkflowStatus: vi.fn(async () => storage.status),
      transitionWorkflow: vi.fn(
        async (
          _tx: unknown,
          _datasetId: string,
          update: {
            patientId: string;
            expectedFrom: WorkflowStatus;
            to: WorkflowStatus;
            refs?: { analysisId?: string };
          },
        ) => {
          if (storage.status !== update.expectedFrom) throw new Error("stale");
          storage.records.workflowTransition.push({
            id: `transition-${storage.records.workflowTransition.length}`,
            patientId: update.patientId,
            version: storage.records.workflowTransition.length + 1,
            from: update.expectedFrom,
            to: update.to,
            occurredAt: "2026-11-03T12:00:00Z",
            actor: "system",
            refs: update.refs,
          });
          storage.status = transition(storage.status, update.to);
          return storage.status;
        },
      ),
    },
    explain: vi.fn(async (): Promise<unknown> => ({
      status: "NEEDS_REVIEW",
      data: {
        summary: "Synthetic explanation",
        relevantInformation: [],
        missingInformation: [],
        uncertainties: [],
        reviewQuestions: [],
        proposals: [
          {
            category: finding.category,
            title: "Preliminary proposal",
            rationale: finding.rationale,
            ruleIds: [finding.ruleId],
            evidenceIds: finding.evidenceIds,
            consideredData: ["Age: 50"],
            uncertainties: [],
          },
        ],
      },
      meta: {
        provider: "mock",
        model: "mock-v1",
        promptVersion: 1,
        profileVersion: 1,
        contextVersion: 1,
      },
    })),
    audit: { provider: "mock", model: "mock-v1", promptVersion: 1 },
    now: () => new Date("2026-11-03T12:00:00Z"),
  } satisfies AnalysisDependencies;
}
beforeEach(() => {
  storage.records = {
    patient: [],
    profile: [],
    context: [],
    examination: [],
    intake: [],
    analysis: [],
    review: [],
    plan: [],
    event: [],
    workflowTransition: [],
  };
  const input = scenarioVariant("first-screening");
  storage.records.profile.push({
    ...input.profile,
    intakeFacts: completeFacts,
  });
  storage.records.context.push(
    clinicalContextSchema.parse(loadClinicalContext("first-screening", 1)),
  );
  storage.status = "INTAKE_COMPLETED";
  storage.scopes = [];
  storage.failEvent = false;
});

describe("dataset analysis orchestration", () => {
  it("writes analysis, proposals and timeline using legal workflow transitions", async () => {
    const deps = dependencies();
    expect(await analyzeSession(db, session, deps)).toMatchObject({
      status: "RECORDED",
      workflowStatus: "MEDICAL_REVIEW_PENDING",
    });
    expect(storage.status).toBe("MEDICAL_REVIEW_PENDING");
    expect(storage.records.analysis).toHaveLength(1);
    expect(storage.records.analysis[0].proposals).toHaveLength(1);
    expect(storage.records.event).toHaveLength(1);
    expect(storage.records.review).toEqual([]);
    expect(storage.records.plan).toEqual([]);
    expect(storage.scopes).toEqual(["dataset-a", "dataset-a"]);
    expect(
      deps.workflow.transitionWorkflow.mock.calls.map((call) => call[2].to),
    ).toEqual(["ANALYSIS_PENDING", "MEDICAL_REVIEW_PENDING"]);
  });
  it("does not duplicate a successful request", async () => {
    const deps = dependencies();
    const first = await analyzeSession(db, session, deps);
    expect(await analyzeSession(db, session, deps)).toMatchObject({
      status: "EXISTING",
      analysisId: "analysisId" in first ? first.analysisId : "missing",
    });
    expect(deps.explain).toHaveBeenCalledTimes(1);
    expect(storage.records.analysis).toHaveLength(1);
  });
  it("returns busy during an existing pending analysis", async () => {
    storage.status = "ANALYSIS_PENDING";
    const deps = dependencies();
    expect(await analyzeSession(db, session, deps)).toEqual({ status: "BUSY" });
    expect(deps.explain).not.toHaveBeenCalled();
  });
  it("records a blocked attempt and permits an immutable retry", async () => {
    const deps = dependencies();
    deps.explain.mockResolvedValueOnce({
      status: "BLOCKED",
      reason: "timeout",
    });
    expect(await analyzeSession(db, session, deps)).toMatchObject({
      workflowStatus: "ANALYSIS_FAILED",
    });
    expect(storage.records.analysis[0].proposals).toEqual([]);
    expect(await analyzeSession(db, session, deps)).toMatchObject({
      workflowStatus: "MEDICAL_REVIEW_PENDING",
    });
    expect(storage.records.analysis.map((record) => record.version)).toEqual([
      1, 2,
    ]);
    expect(storage.records.analysis[0].status).toBe("BLOCKED");
  });
  it("rejects a profile change during the provider call", async () => {
    const deps = dependencies();
    const response = await deps.explain();
    deps.explain.mockImplementationOnce(async () => {
      storage.records.profile.push({
        ...storage.records.profile[0],
        id: "new-profile",
        version: 2,
      });
      return response;
    });
    expect(await analyzeSession(db, session, deps)).toEqual({
      status: "STALE",
    });
    expect(storage.records.analysis).toEqual([]);
    expect(storage.status).toBe("ANALYSIS_FAILED");
  });
  it("does not complete a superseded pending request", async () => {
    const deps = dependencies();
    const response = await deps.explain();
    deps.explain.mockImplementationOnce(async () => {
      const pending = storage.records.workflowTransition.at(-1)!;
      storage.records.workflowTransition.push({
        ...pending,
        id: "new-reservation",
        version: pending.version + 1,
        refs: { analysisId: "another-analysis" },
      });
      return response;
    });
    expect(await analyzeSession(db, session, deps)).toEqual({
      status: "STALE",
    });
    expect(storage.records.analysis).toEqual([]);
    expect(storage.status).toBe("ANALYSIS_PENDING");
  });
  it("rolls back analysis and event if persistence fails", async () => {
    storage.failEvent = true;
    await expect(analyzeSession(db, session, dependencies())).rejects.toThrow(
      "Analysis could not be saved. Retry the analysis.",
    );
    expect(storage.records.analysis).toEqual([]);
    expect(storage.records.event).toEqual([]);
    expect(storage.status).toBe("ANALYSIS_FAILED");
  });
  it("records rule-selected gaps without calling the provider", async () => {
    storage.records.profile[0].age = null;
    const deps = dependencies();
    expect(await analyzeSession(db, session, deps)).toMatchObject({
      workflowStatus: "CLARIFICATION_REQUIRED",
    });
    expect(deps.explain).not.toHaveBeenCalled();
    expect(storage.records.analysis[0].missingInformation).toContain(
      "profile.age",
    );
    expect(storage.records.event[0].kind).toBe("CLARIFICATION_REQUESTED");
  });
  it("records missing evidence as a blocked analysis without a provider call", async () => {
    storage.records.context[0].evidence = [];
    const deps = dependencies();
    expect(await analyzeSession(db, session, deps)).toMatchObject({
      status: "RECORDED",
      workflowStatus: "ANALYSIS_FAILED",
    });
    expect(deps.explain).not.toHaveBeenCalled();
    expect(storage.records.analysis[0].status).toBe("BLOCKED");
    expect(storage.records.analysis[0].proposals).toEqual([]);
  });
  it("cannot analyze a patient outside the active dataset", async () => {
    storage.records.profile = [];
    const deps = dependencies();
    expect(
      await analyzeSession(
        db,
        { ...session, datasetId: "empty-dataset" },
        deps,
      ),
    ).toEqual({ status: "NOT_READY" });
    expect(deps.explain).not.toHaveBeenCalled();
    expect(storage.records.analysis).toEqual([]);
  });
});
