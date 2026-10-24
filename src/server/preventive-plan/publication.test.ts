import { beforeEach, describe, expect, it, vi } from "vitest";
import { planInput } from "../../features/preventive-plan/test-fixtures";
import type { DatasetRepository } from "../db/repository";
import type { RecordKind, Records } from "../db/records";
import type { Prisma } from "../../generated/prisma/client";

const workflow = vi.hoisted(() => ({
  getWorkflowStatus: vi.fn(async () => "MEDICAL_REVIEW_COMPLETED"),
  transitionWorkflow: vi.fn(async () => undefined),
  repository: vi.fn(),
}));
vi.mock("../workflow/state", () => workflow);
vi.mock("../db/repository", () => ({ datasetRepository: workflow.repository }));
import { publishReviewedPlan } from "./publication";
import { readPatientPlan } from "./reader";
const tx = {} as Prisma.TransactionClient;

function repository() {
  const input = planInput();
  const records: { [K in RecordKind]: Records[K][] } = {
    workflowTransition: [],
    patient: [
      {
        id: input.patientId,
        displayName: "Synthetic example",
        synthetic: true,
        status: "NOT_STARTED",
      },
    ],
    profile: [input.profile],
    analysis: [input.analysis],
    review: [input.review],
    context: [input.context],
    plan: [],
    event: [],
    examination: [],
    intake: [],
  };
  const append = vi.fn(async (kind: RecordKind, value: unknown) => {
    (records[kind] as unknown[]).push(value);
  });
  const repo: DatasetRepository = {
    list: async <K extends RecordKind>(kind: K) =>
      structuredClone(records[kind]),
    append,
  };
  workflow.repository.mockReturnValue(repo);
  return { records, repo, append, input };
}

describe("plan publication service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("publishes only plan and own event and applies the canonical transition", async () => {
    const { records, input, append } = repository();
    const plan = await publishReviewedPlan(
      tx,
      "dataset-a",
      input.patientId,
      input.review.id,
    );
    expect(append.mock.calls.map(([kind]) => kind)).toEqual(["plan", "event"]);
    expect(records.event).toMatchObject([
      {
        kind: "PLAN_PUBLISHED",
        entityId: plan.id,
        entityVersion: 1,
        provenance: "PHYSICIAN_REVIEWED",
      },
    ]);
    expect(workflow.transitionWorkflow).toHaveBeenCalledWith(
      tx,
      "dataset-a",
      expect.objectContaining({
        to: "PLAN_AVAILABLE",
        expectedFrom: "MEDICAL_REVIEW_COMPLETED",
        refs: expect.objectContaining({ planId: plan.id }),
      }),
    );
  });
  it("returns the same immutable plan on repeat publication without new events", async () => {
    const { records, input } = repository();
    const first = await publishReviewedPlan(
      tx,
      "dataset-a",
      input.patientId,
      input.review.id,
    );
    const second = await publishReviewedPlan(
      tx,
      "dataset-a",
      input.patientId,
      input.review.id,
    );
    expect(first).toEqual(second);
    expect(records.plan).toHaveLength(1);
    expect(records.event).toHaveLength(1);
    expect(workflow.transitionWorkflow).toHaveBeenCalledTimes(1);
  });
  it("does not write when review is stale or another patient asks", async () => {
    const { input, append, records } = repository();
    await expect(
      publishReviewedPlan(tx, "dataset-a", "other", input.review.id),
    ).rejects.toThrow();
    records.profile[0].version = 2;
    await expect(
      publishReviewedPlan(tx, "dataset-a", input.patientId, input.review.id),
    ).rejects.toThrow();
    expect(append).not.toHaveBeenCalled();
  });
  it("does not substitute a different review when an unknown ID is supplied", async () => {
    const { input, append } = repository();
    await expect(
      publishReviewedPlan(tx, "dataset-a", input.patientId, "unknown"),
    ).rejects.toThrow();
    expect(append).not.toHaveBeenCalled();
  });
  it("rejects a fabricated source URL even when its evidence ID matches", async () => {
    const { input, records, append } = repository();
    records.context[0].evidence[0].sourceUrl = "https://example.com/fabricated";
    await expect(
      publishReviewedPlan(tx, "dataset-a", input.patientId, input.review.id),
    ).rejects.toThrow();
    expect(append).not.toHaveBeenCalled();
  });
  it("shows no preliminary proposal when no published plan exists", async () => {
    const { repo, input } = repository();
    const data = await readPatientPlan(repo, input.patientId, "PLAN_AVAILABLE");
    expect(data.plan).toBeNull();
    expect(JSON.stringify(data)).not.toContain("Reviewed action wording");
    expect(JSON.stringify(data)).not.toContain("Rejected proposal");
  });
  it("hides a persisted plan whose text or review link was fabricated", async () => {
    const { repo, input, records } = repository();
    await publishReviewedPlan(
      tx,
      "dataset-a",
      input.patientId,
      input.review.id,
    );
    records.plan[0].actions[0].text = "Unreviewed injected text";
    expect(
      (await readPatientPlan(repo, input.patientId, "PLAN_AVAILABLE")).plan,
    ).toBeNull();
    records.review.length = 0;
    expect(
      (await readPatientPlan(repo, input.patientId, "PLAN_AVAILABLE")).plan,
    ).toBeNull();
  });
  it("keeps the old reviewed plan readable and labeled previous after a profile update", async () => {
    const { repo, input, records } = repository();
    const plan = await publishReviewedPlan(
      tx,
      "dataset-a",
      input.patientId,
      input.review.id,
    );
    records.profile.push({ ...input.profile, id: "profile-2", version: 2 });
    const data = await readPatientPlan(repo, input.patientId, "PLAN_AVAILABLE");
    expect(data.plan).toEqual(plan);
    expect(data.previous).toBe(true);
  });
  it("does not disclose another patient's persisted plan", async () => {
    const { repo, input, records } = repository();
    await publishReviewedPlan(
      tx,
      "dataset-a",
      input.patientId,
      input.review.id,
    );
    records.patient.push({
      id: "other",
      displayName: "Other synthetic case",
      synthetic: true,
      status: "NOT_STARTED",
    });
    expect(
      (await readPatientPlan(repo, "other", "PLAN_AVAILABLE")).plan,
    ).toBeNull();
  });
  it("never substitutes the current plan for an unknown historical plan ID", async () => {
    const { repo, input } = repository();
    await publishReviewedPlan(
      tx,
      "dataset-a",
      input.patientId,
      input.review.id,
    );
    expect(
      (
        await readPatientPlan(
          repo,
          input.patientId,
          "PLAN_AVAILABLE",
          "unknown-plan",
        )
      ).plan,
    ).toBeNull();
  });
  it("returns an explicitly selected old version with the previous label", async () => {
    const { repo, input, records } = repository();
    const original = await publishReviewedPlan(
      tx,
      "dataset-a",
      input.patientId,
      input.review.id,
    );
    records.review.push({ ...input.review, version: 2 });
    records.plan.push({
      ...original,
      id: "plan-2",
      version: 2,
      reviewVersion: 2,
      previousPlanId: original.id,
    });
    const selected = await readPatientPlan(
      repo,
      input.patientId,
      "PLAN_AVAILABLE",
      original.id,
    );
    expect(selected.plan).toEqual(original);
    expect(selected.previous).toBe(true);
  });
});
