import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatasetRepository } from "../db/repository";
import type { Prisma } from "../../generated/prisma/client";
import { historyFixture } from "../../features/health-timeline/test-fixtures";
import type { PreventivePlan } from "../../features/patients/contracts";

const mocks = vi.hoisted(() => ({
  status: vi.fn(),
  transition: vi.fn(),
  readPlan: vi.fn(),
  repository: vi.fn(),
}));
vi.mock("../db/repository", () => ({ datasetRepository: mocks.repository }));
vi.mock("../workflow/state", () => ({
  getWorkflowStatus: mocks.status,
  transitionWorkflow: mocks.transition,
}));
vi.mock("../preventive-plan/reader", () => ({
  readPatientPlan: mocks.readPlan,
}));
import { beginReassessment } from "./reassessment";
const tx = {} as Prisma.TransactionClient;

function setup() {
  const { records, patientId } = historyFixture();
  const repo = { list: vi.fn(), append: vi.fn() } satisfies DatasetRepository;
  repo.list.mockImplementation(async (kind) =>
    kind === "profile"
      ? records.profiles
      : kind === "plan"
        ? records.plans
        : [],
  );
  mocks.status.mockResolvedValue("PLAN_AVAILABLE");
  mocks.repository.mockReturnValue(repo);
  mocks.readPlan.mockResolvedValue({ plan: records.plans[0] });
  return {
    records,
    patientId,
    repo,
    request: { planId: records.plans[0].id, profileVersion: 1 },
  };
}

describe("reassessment entry", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("uses the canonical transition, records its own event and preserves the old plan", async () => {
    const { records, patientId, repo, request } = setup();
    const before = structuredClone(records);
    await beginReassessment(tx, "dataset-a", patientId, request);
    expect(mocks.transition).toHaveBeenCalledWith(
      tx,
      "dataset-a",
      expect.objectContaining({
        patientId,
        to: "REASSESSMENT_PENDING",
        expectedFrom: "PLAN_AVAILABLE",
        refs: { planId: "plan-1", profileVersion: 1 },
      }),
    );
    expect(repo.append).toHaveBeenCalledWith(
      "event",
      expect.objectContaining({
        kind: "REASSESSMENT_REQUESTED",
        entityId: records.profiles[0].id,
        entityVersion: 1,
      }),
    );
    expect(records).toEqual(before);
    expect(repo.append.mock.calls.map(([kind]) => kind)).toEqual(["event"]);
  });
  it.each(["REASSESSMENT_PENDING", "INTAKE_IN_PROGRESS"])(
    "resumes %s without duplicate events or transitions",
    async (status) => {
      const { patientId, repo, request } = setup();
      mocks.status.mockResolvedValue(status);
      await beginReassessment(tx, "dataset-a", patientId, request);
      expect(mocks.transition).not.toHaveBeenCalled();
      expect(repo.append).not.toHaveBeenCalled();
    },
  );
  it.each([
    { planId: "plan-1", profileVersion: 0 },
    { planId: "plan-1", profileVersion: 2 },
    { planId: "unknown", profileVersion: 1 },
    { planId: "", profileVersion: 1 },
  ])("rejects stale or invalid input %j", async (request) => {
    const { patientId, repo } = setup();
    await expect(
      beginReassessment(tx, "dataset-a", patientId, request),
    ).rejects.toThrow();
    expect(mocks.transition).not.toHaveBeenCalled();
    expect(repo.append).not.toHaveBeenCalled();
  });
  it("rejects an old plan when a newer plan exists", async () => {
    const { patientId, records, request } = setup();
    const next: PreventivePlan = {
      ...records.plans[0],
      id: "plan-2",
      version: 2,
      previousPlanId: "plan-1",
    };
    records.plans.push(next);
    await expect(
      beginReassessment(tx, "dataset-a", patientId, request),
    ).rejects.toThrow();
    expect(mocks.transition).not.toHaveBeenCalled();
  });
  it("rejects cross-patient access and unreviewed plans", async () => {
    const { patientId, request } = setup();
    await expect(
      beginReassessment(tx, "dataset-a", "other", request),
    ).rejects.toThrow();
    mocks.readPlan.mockResolvedValue({ plan: null });
    await expect(
      beginReassessment(tx, "dataset-a", patientId, request),
    ).rejects.toThrow();
    expect(mocks.transition).not.toHaveBeenCalled();
  });
  it("never moves a failed analysis directly to reassessment or plan publication", async () => {
    const { patientId, repo, request } = setup();
    mocks.status.mockResolvedValue("ANALYSIS_FAILED");
    await expect(
      beginReassessment(tx, "dataset-a", patientId, request),
    ).rejects.toThrow();
    expect(mocks.transition).not.toHaveBeenCalled();
    expect(repo.append).not.toHaveBeenCalled();
  });
});
