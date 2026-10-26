import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../../generated/prisma/client";
import { readerFixture } from "../../../tests/fixtures/clinical-review";
import { loadClinicalContext } from "../clinical-rules/context";
import { clinicalContextSchema } from "../../features/patients/contracts";
import { workspaceId } from "../../features/clinical-review/reader";
import type {
  MedicalReview,
  TimelineEvent,
} from "../../features/patients/contracts";

const mocks = vi.hoisted(() => ({
  status: vi.fn(),
  transition: vi.fn(),
  transaction: vi.fn(),
  publish: vi.fn(),
}));
vi.mock("../db/repository", () => ({
  inDatasetTransaction: mocks.transaction,
}));
vi.mock("../preventive-plan/publication", () => ({
  publishReviewedPlan: mocks.publish,
}));
vi.mock("../workflow/state", () => ({
  getWorkflowStatus: mocks.status,
  transitionWorkflow: mocks.transition,
}));
import { recordReview } from "./decisions";

const session = {
  datasetId: "dataset-a",
  caseId: "first-screening" as const,
  patientId: "synthetic-patient-01",
};
const input = {
  expectedReviewVersion: 0,
  decisions: [
    {
      proposalId: "proposal-1",
      decision: "APPROVE",
      reason: "",
      revisedText: null,
    },
  ],
  intent: "finalize",
};

function setup() {
  const data = readerFixture();
  const context = loadClinicalContext("first-screening", 1);
  data.contexts = [clinicalContextSchema.parse(context)];
  data.analyses[0].contextId = context.id;
  data.analyses[0].proposals[0].ruleIds = ["crc-screening-due"];
  data.analyses[0].proposals[0].evidenceIds = ["uspstf-crc-2021"];
  const records = {
    patient: data.patients,
    profile: data.profiles,
    examination: data.examinations,
    analysis: data.analyses,
    context: data.contexts,
    review: data.reviews,
    event: [] as TimelineEvent[],
  };
  const append = vi.fn(
    async (kind: "review" | "event", record: MedicalReview | TimelineEvent) => {
      if (kind === "review") records.review.push(record as MedicalReview);
      else records.event.push(record as TimelineEvent);
    },
  );
  const repository = {
    list: vi.fn(async (kind: keyof typeof records) => records[kind]),
    append,
  };
  mocks.status.mockResolvedValue("MEDICAL_REVIEW_PENDING");
  const tx = {};
  const transaction = mocks.transaction.mockImplementation(
    async (_db, _datasetId, callback) => {
      const savedReviews = records.review.slice();
      const savedEvents = records.event.slice();
      try {
        return await callback(repository, tx);
      } catch (error) {
        records.review.splice(0, records.review.length, ...savedReviews);
        records.event.splice(0, records.event.length, ...savedEvents);
        throw error;
      }
    },
  );
  const db = {} as PrismaClient;
  return {
    data,
    records,
    append,
    repository,
    db,
    tx,
    id: workspaceId(data.analyses[0]),
    transaction,
  };
}

describe("physician review transactions", () => {
  beforeEach(() => vi.resetAllMocks());
  it("locks before reads, scopes repository and records audit completion atomically", async () => {
    const ctx = setup();
    const result = await recordReview(ctx.db, session, ctx.id, input);
    expect(ctx.transaction).toHaveBeenCalledOnce();
    expect(mocks.status.mock.invocationCallOrder[0]).toBeLessThan(
      ctx.repository.list.mock.invocationCallOrder[0],
    );
    expect(ctx.transaction).toHaveBeenCalledWith(
      ctx.db,
      session.datasetId,
      expect.any(Function),
    );
    expect(mocks.publish).toHaveBeenCalledWith(
      ctx.tx,
      session.datasetId,
      session.patientId,
      result.id,
    );
    expect(result).toMatchObject({
      reviewerId: "demo-physician",
      analysisVersion: 1,
    });
    expect(result.completedAt).not.toBeNull();
    expect(ctx.records.event).toMatchObject([
      {
        kind: "REVIEW_COMPLETED",
        entityId: result.id,
        entityVersion: 1,
        provenance: "PHYSICIAN_REVIEWED",
      },
    ]);
    expect(mocks.transition.mock.calls.map((call) => call[2].to)).toEqual([
      "MEDICAL_REVIEW_IN_PROGRESS",
      "MEDICAL_REVIEW_COMPLETED",
    ]);
    expect(ctx.append.mock.calls.map((call) => call[0])).toEqual([
      "review",
      "event",
    ]);
  });
  it("rejects a missing session before any transaction", async () => {
    const ctx = setup();
    await expect(recordReview(ctx.db, null, ctx.id, input)).rejects.toThrow(
      /session/i,
    );
    expect(ctx.transaction).not.toHaveBeenCalled();
  });
  it("rejects foreign patient, unknown workspace and invalid workflow", async () => {
    const ctx = setup();
    await expect(
      recordReview(ctx.db, { ...session, patientId: "foreign" }, ctx.id, input),
    ).rejects.toThrow();
    await expect(
      recordReview(ctx.db, session, "unknown", input),
    ).rejects.toThrow();
    mocks.status.mockResolvedValue("ANALYSIS_FAILED");
    await expect(
      recordReview(ctx.db, session, ctx.id, input),
    ).rejects.toThrow();
    expect(ctx.append).not.toHaveBeenCalled();
  });
  it("rolls back the review and event if the completion transition fails", async () => {
    const ctx = setup();
    mocks.transition.mockImplementation(async (_tx, _dataset, value) => {
      if (value.to === "MEDICAL_REVIEW_COMPLETED")
        throw new Error("Transition conflict");
    });
    await expect(recordReview(ctx.db, session, ctx.id, input)).rejects.toThrow(
      "Transition conflict",
    );
    expect(ctx.records.review).toEqual([]);
    expect(ctx.records.event).toEqual([]);
  });
  it("saves pending decisions without completion and routes clarification separately", async () => {
    for (const decision of ["PENDING", "CLARIFY"]) {
      const ctx = setup();
      mocks.transition.mockResolvedValue(undefined);
      mocks.transition.mockClear();
      const result = await recordReview(ctx.db, session, ctx.id, {
        ...input,
        intent: "save",
        decisions: [
          {
            ...input.decisions[0],
            decision,
            ...(decision === "CLARIFY"
              ? { clarification: { question: "When was your last test?" } }
              : {}),
          },
        ],
      });
      expect(result.completedAt).toBeNull();
      expect(
        mocks.transition.mock.calls.map((call) => call[2].to),
      ).not.toContain("MEDICAL_REVIEW_COMPLETED");
      expect(mocks.transition.mock.calls.map((call) => call[2].to)).toContain(
        decision === "CLARIFY"
          ? "CLARIFICATION_REQUIRED"
          : "MEDICAL_REVIEW_IN_PROGRESS",
      );
    }
  });
  it("rejects fabricated public URLs and unsupported rule/category or evidence mappings", async () => {
    for (const kind of [
      "url",
      "category",
      "mapping",
      "duplicate-evidence",
      "duplicate-rules",
      "reviewed",
    ] as const) {
      const ctx = setup();
      if (kind === "duplicate-evidence")
        ctx.records.context[0].evidence[1] = structuredClone(
          ctx.records.context[0].evidence[0],
        );
      if (kind === "duplicate-rules")
        ctx.records.context[0].ruleIds[1] = ctx.records.context[0].ruleIds[0];
      if (kind === "reviewed")
        ctx.records.context[0].evidence[0].medicallyReviewed = true;
      if (kind === "url")
        ctx.records.context[0].evidence[0].sourceUrl =
          "https://example.org/fabricated";
      if (kind === "category")
        ctx.records.analysis[0].proposals[0].category = "POSSIBLE_REDUNDANCY";
      if (kind === "mapping")
        ctx.records.analysis[0].proposals[0].evidenceIds = [
          "usmstf-colonoscopy-2020",
        ];
      await expect(
        recordReview(ctx.db, session, ctx.id, input),
      ).rejects.toThrow();
      expect(ctx.append).not.toHaveBeenCalled();
    }
  });
  it("rejects stale draft and duplicate completion without extra writes", async () => {
    const ctx = setup();
    mocks.transition.mockResolvedValue(undefined);
    await recordReview(ctx.db, session, ctx.id, input);
    await expect(
      recordReview(ctx.db, session, ctx.id, {
        ...input,
        expectedReviewVersion: 1,
      }),
    ).rejects.toThrow(/finalized/i);
    expect(ctx.records.review).toHaveLength(1);
    expect(ctx.records.event).toHaveLength(1);
  });
});
