import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, expect, it, vi } from "vitest";
import { createDatabase } from "../../src/server/db/client";
import {
  datasetRepository,
  inDatasetTransaction,
} from "../../src/server/db/repository";
import { loadDemoCase, replaceDemoDataset } from "../../src/server/demo/store";
import {
  getReviewQueue,
  getReviewWorkspace,
} from "../../src/server/clinical-review/reader";
import {
  getWorkflowStatus,
  transitionWorkflow,
} from "../../src/server/workflow/state";
import {
  openReview,
  recordReview,
} from "../../src/server/clinical-review/decisions";
import { listOpenClarificationRequests } from "../../src/server/clinical-review/clarifications";
import { workspaceId } from "../../src/features/clinical-review/reader";
import { planInput } from "../../src/features/preventive-plan/test-fixtures";
import type { WorkflowStatus } from "../../src/features/workflow/workflow";

const readerMocks = vi.hoisted(() => ({
  session: vi.fn(),
  database: vi.fn(),
}));
vi.mock("../../src/server/demo/session", () => ({
  getDemoSession: readerMocks.session,
}));
vi.mock("../../src/server/db/client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/server/db/client")>();
  return { ...actual, getDatabase: readerMocks.database };
});

const fault = vi.hoisted(() => ({ afterPublication: false }));
vi.mock(
  "../../src/server/preventive-plan/publication",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../src/server/preventive-plan/publication")
      >();
    return {
      publishReviewedPlan: async (
        ...args: Parameters<typeof actual.publishReviewedPlan>
      ) => {
        const result = await actual.publishReviewedPlan(...args);
        if (fault.afterPublication)
          throw new Error("Injected failure after plan writes");
        return result;
      },
    };
  },
);

if (!process.env.TEST_DATABASE_URL)
  throw new Error("TEST_DATABASE_URL must name a disposable database");
const db = createDatabase(process.env.TEST_DATABASE_URL);
const datasets: string[] = [];
readerMocks.database.mockReturnValue(db);
afterEach(() => {
  fault.afterPublication = false;
});
afterAll(async () => {
  await db.dataset.deleteMany({ where: { id: { in: datasets } } });
  await db.$disconnect();
});

async function fixture() {
  const datasetId = "review-test-" + randomUUID();
  datasets.push(datasetId);
  await replaceDemoDataset(db, datasetId, "first-screening");
  const repo = datasetRepository(db, datasetId);
  const profile = (await repo.list("profile"))[0];
  const context = (await repo.list("context"))[0];
  const input = planInput();
  const analysisId = randomUUID();
  // Synthetic contract fixture: only the supported first-screening proposal.
  const analysis = {
    ...input.analysis,
    id: analysisId,
    patientId: profile.patientId,
    profileVersion: profile.version,
    contextId: context.id,
    contextVersion: context.version,
    proposals: [
      { ...input.analysis.proposals[0], id: randomUUID(), analysisId },
    ],
  };
  const session = { datasetId, patientId: profile.patientId };
  await inDatasetTransaction(db, datasetId, async (repository, tx) => {
    const advance = (expectedFrom: WorkflowStatus, to: WorkflowStatus) =>
      transitionWorkflow(tx, datasetId, {
        patientId: session.patientId,
        expectedFrom,
        to,
        actor: "system",
        refs: { profileVersion: profile.version, analysisId },
      });
    await advance("NOT_STARTED", "INTAKE_IN_PROGRESS");
    await repository.append("intake", {
      id: randomUUID(),
      patientId: session.patientId,
      profileVersion: profile.version,
      answers: {},
      completedAt: new Date().toISOString(),
    });
    await advance("INTAKE_IN_PROGRESS", "INTAKE_COMPLETED");
    await advance("INTAKE_COMPLETED", "ANALYSIS_PENDING");
    await repository.append("analysis", analysis);
    await advance("ANALYSIS_PENDING", "MEDICAL_REVIEW_PENDING");
  });
  return {
    session,
    repo,
    profile,
    analysis,
    id: workspaceId(analysis),
    submission: {
      expectedReviewVersion: 0,
      intent: "finalize" as const,
      decisions: [
        {
          proposalId: analysis.proposals[0].id,
          decision: "APPROVE" as const,
          reason: "",
          revisedText: null,
        },
      ],
    },
  };
}

it("serializes concurrent finalization into one review, completion and published plan", async () => {
  const ctx = await fixture();
  const submit = () => recordReview(db, ctx.session, ctx.id, ctx.submission);
  const results = await Promise.allSettled([submit(), submit()]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  const reviews = await ctx.repo.list("review");
  expect(reviews).toHaveLength(1);
  expect(reviews[0].completedAt).not.toBeNull();
  expect(reviews[0].reviewerId).toBe("demo-physician");
  expect(await ctx.repo.list("plan")).toHaveLength(1);
  expect(
    (await ctx.repo.list("event")).filter((e) => e.kind === "REVIEW_COMPLETED"),
  ).toHaveLength(1);
  expect(
    (await ctx.repo.list("workflowTransition")).filter(
      (t) => t.to === "MEDICAL_REVIEW_COMPLETED",
    ),
  ).toHaveLength(1);
  expect(
    await getWorkflowStatus(db, ctx.session.datasetId, ctx.session.patientId),
  ).toBe("PLAN_AVAILABLE");
});

it("serializes competing drafts and preserves immutable versions with compare-and-swap", async () => {
  const ctx = await fixture();
  const submit = () =>
    recordReview(db, ctx.session, ctx.id, {
      ...ctx.submission,
      intent: "save",
    });
  const results = await Promise.allSettled([submit(), submit()]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  const first = (await ctx.repo.list("review"))[0];
  expect(first.completedAt).toBeNull();
  await recordReview(db, ctx.session, ctx.id, {
    ...ctx.submission,
    expectedReviewVersion: 1,
  });
  const reviews = await ctx.repo.list("review");
  expect(reviews).toHaveLength(2);
  expect(reviews.find((r) => r.version === 1)).toEqual(first);
  expect(reviews.find((r) => r.version === 2)?.completedAt).not.toBeNull();
});

it("rolls back review, audit, workflow and plan after downstream publication writes fail", async () => {
  const ctx = await fixture();
  const transitions = await ctx.repo.list("workflowTransition");
  const events = await ctx.repo.list("event");
  fault.afterPublication = true;
  await expect(
    recordReview(db, ctx.session, ctx.id, ctx.submission),
  ).rejects.toThrow("Injected failure after plan writes");
  expect(await ctx.repo.list("review")).toEqual([]);
  expect(await ctx.repo.list("event")).toEqual(events);
  expect(await ctx.repo.list("plan")).toEqual([]);
  expect(await ctx.repo.list("workflowTransition")).toEqual(transitions);
  expect(
    await getWorkflowStatus(db, ctx.session.datasetId, ctx.session.patientId),
  ).toBe("MEDICAL_REVIEW_PENDING");
});

it("keeps clarification incomplete, publishes nothing and requires a fresh analysis", async () => {
  const ctx = await fixture();
  const review = await recordReview(db, ctx.session, ctx.id, {
    ...ctx.submission,
    intent: "save",
    decisions: [
      {
        ...ctx.submission.decisions[0],
        decision: "CLARIFY",
        reason: "Confirm reported information",
        clarification: {
          question: "What colorectal screening have you had before?",
          targetField: "priorScreening",
        },
      },
    ],
  });
  expect(review.completedAt).toBeNull();
  const stored = (await ctx.repo.list("review"))[0];
  expect(stored.decisions[0].clarification).toEqual({
    question: "What colorectal screening have you had before?",
    targetField: "priorScreening",
  });
  const { datasetId, patientId } = ctx.session;
  expect(await listOpenClarificationRequests(db, datasetId, patientId)).toEqual(
    [
      {
        reviewId: review.id,
        reviewVersion: 1,
        analysisId: ctx.analysis.id,
        analysisVersion: ctx.analysis.version,
        proposalId: ctx.analysis.proposals[0].id,
        question: "What colorectal screening have you had before?",
        targetField: "priorScreening",
      },
    ],
  );
  expect(
    await getWorkflowStatus(db, ctx.session.datasetId, ctx.session.patientId),
  ).toBe("CLARIFICATION_REQUIRED");
  expect(
    (await ctx.repo.list("event")).some(
      (e) => e.kind === "REVIEW_CLARIFICATION_REQUESTED",
    ),
  ).toBe(true);
  await expect(
    recordReview(db, ctx.session, ctx.id, {
      ...ctx.submission,
      expectedReviewVersion: 1,
    }),
  ).rejects.toThrow(/workflow/i);
  expect(await ctx.repo.list("review")).toHaveLength(1);
  expect(await ctx.repo.list("plan")).toEqual([]);
});

it("rejects stale versions and foreign dataset identifiers without review writes", async () => {
  const ctx = await fixture();
  await inDatasetTransaction(db, ctx.session.datasetId, async (repo, tx) => {
    await getWorkflowStatus(tx, ctx.session.datasetId, ctx.session.patientId);
    await repo.append("profile", {
      ...ctx.profile,
      id: randomUUID(),
      version: 2,
    });
  });
  await expect(
    recordReview(db, ctx.session, ctx.id, ctx.submission),
  ).rejects.toThrow(/stale/i);
  const other = await fixture();
  await expect(
    recordReview(db, other.session, ctx.id, ctx.submission),
  ).rejects.toThrow(/unavailable/i);
  expect(await ctx.repo.list("review")).toEqual([]);
  expect(await other.repo.list("review")).toEqual([]);
});

it("exposes no reader records after a demo case replacement expires the session snapshot", async () => {
  const ctx = await fixture();
  const selected = await loadDemoCase(db, ctx.session.datasetId);
  if (!selected) throw new Error("A selected demo fixture is required");
  readerMocks.session.mockResolvedValue({ ...selected, ...ctx.session });
  expect(await getReviewQueue()).toHaveLength(1);
  await replaceDemoDataset(db, ctx.session.datasetId, "repeat-screening");
  const patients = await ctx.repo.list("patient");
  expect(patients.map((patient) => patient.id)).not.toContain(
    ctx.session.patientId,
  );
  expect(await getReviewQueue()).toEqual([]);
  expect(await getReviewWorkspace(ctx.id)).toBeNull();
});

it("closes physician clarification requests once analysis resumes or the system asks instead", async () => {
  const ctx = await fixture();
  const { datasetId, patientId } = ctx.session;
  await recordReview(db, ctx.session, ctx.id, {
    ...ctx.submission,
    intent: "save",
    decisions: [
      {
        ...ctx.submission.decisions[0],
        decision: "CLARIFY",
        clarification: { question: "Have you had a colonoscopy before?" },
      },
    ],
  });
  const open = await inDatasetTransaction(db, datasetId, (_repo, tx) =>
    listOpenClarificationRequests(tx, datasetId, patientId),
  );
  expect(open).toHaveLength(1);
  expect(open[0]).not.toHaveProperty("targetField");
  await inDatasetTransaction(db, datasetId, async (_repo, tx) => {
    await transitionWorkflow(tx, datasetId, {
      patientId,
      expectedFrom: "CLARIFICATION_REQUIRED",
      to: "ANALYSIS_PENDING",
      actor: "patient",
      refs: { profileVersion: ctx.profile.version, analysisId: randomUUID() },
    });
  });
  expect(await listOpenClarificationRequests(db, datasetId, patientId)).toEqual(
    [],
  );
  await transitionWorkflow(db, datasetId, {
    patientId,
    expectedFrom: "ANALYSIS_PENDING",
    to: "CLARIFICATION_REQUIRED",
    actor: "system",
    refs: { profileVersion: ctx.profile.version, analysisId: randomUUID() },
  });
  // Analysis-originated clarification is not a physician request.
  expect(await listOpenClarificationRequests(db, datasetId, patientId)).toEqual(
    [],
  );
});

it("opening a current review moves pending to in progress exactly once", async () => {
  const ctx = await fixture();
  const { datasetId, patientId } = ctx.session;
  const opened = await Promise.all([
    openReview(db, ctx.session, ctx.id),
    openReview(db, ctx.session, ctx.id),
  ]);
  expect(opened.filter(Boolean)).toHaveLength(1);
  expect(await getWorkflowStatus(db, datasetId, patientId)).toBe(
    "MEDICAL_REVIEW_IN_PROGRESS",
  );
  const opens = (await ctx.repo.list("workflowTransition")).filter(
    (t) => t.to === "MEDICAL_REVIEW_IN_PROGRESS",
  );
  expect(opens).toHaveLength(1);
  expect(opens[0].actor).toBe("demo-physician");
  expect(await openReview(db, ctx.session, ctx.id)).toBe(false);
  await recordReview(db, ctx.session, ctx.id, ctx.submission);
  expect(await getWorkflowStatus(db, datasetId, patientId)).toBe(
    "PLAN_AVAILABLE",
  );
  expect((await ctx.repo.list("event")).map((e) => e.kind)).toEqual(
    expect.arrayContaining(["REVIEW_COMPLETED", "PLAN_PUBLISHED"]),
  );
});

it("does not open a stale, foreign or missing review", async () => {
  const ctx = await fixture();
  const { datasetId, patientId } = ctx.session;
  expect(await openReview(db, null, ctx.id)).toBe(false);
  expect(await openReview(db, ctx.session, "unknown--v1")).toBe(false);
  const other = await fixture();
  expect(await openReview(db, other.session, ctx.id)).toBe(false);
  await inDatasetTransaction(db, datasetId, async (repo, tx) => {
    await getWorkflowStatus(tx, datasetId, patientId);
    await repo.append("profile", {
      ...ctx.profile,
      id: randomUUID(),
      version: 2,
    });
  });
  expect(await openReview(db, ctx.session, ctx.id)).toBe(false);
  expect(await getWorkflowStatus(db, datasetId, patientId)).toBe(
    "MEDICAL_REVIEW_PENDING",
  );
  await replaceDemoDataset(db, datasetId, "repeat-screening");
  expect(await openReview(db, ctx.session, ctx.id)).toBe(false);
});
