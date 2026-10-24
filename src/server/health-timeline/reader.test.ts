import { beforeEach, expect, it, vi } from "vitest";
import { historyFixture } from "../../features/health-timeline/test-fixtures";
import type { DatasetRepository } from "../db/repository";

const mocks = vi.hoisted(() => ({ status: vi.fn(), plan: vi.fn() }));
vi.mock("../workflow/state", () => ({ getWorkflowStatus: mocks.status }));
vi.mock("../preventive-plan/reader", () => ({ readPatientPlan: mocks.plan }));
import { readPatientHistory } from "./reader";

function setup() {
  const { records, patientId } = historyFixture();
  const values = new Map<string, unknown[]>([
    [
      "patient",
      [
        {
          id: patientId,
          displayName: "Synthetic example",
          synthetic: true,
          status: "PLAN_AVAILABLE",
        },
      ],
    ],
    ["profile", records.profiles],
    ["intake", records.intakes],
    ["analysis", records.analyses],
    ["review", records.reviews],
    ["plan", records.plans],
    ["event", records.events],
  ]);
  const repo = { list: vi.fn(), append: vi.fn() } satisfies DatasetRepository;
  repo.list.mockImplementation(async (kind) => values.get(kind) ?? []);
  mocks.status.mockResolvedValue("PLAN_AVAILABLE");
  mocks.plan.mockImplementation(async (_repo, _patient, _status, id) => ({
    plan: records.plans.find((p) => p.id === id) ?? null,
  }));
  return { repo, records, patientId };
}

beforeEach(() => {
  vi.resetAllMocks();
});

it("returns metadata and only plan versions accepted by the reviewed-plan guard", async () => {
  const { repo, patientId, records } = setup();
  const data = await readPatientHistory(repo, patientId, "PLAN_AVAILABLE");
  expect(data.events).toHaveLength(5);
  expect(data.plans).toHaveLength(1);
  expect(mocks.plan).toHaveBeenCalledWith(
    repo,
    patientId,
    "PLAN_AVAILABLE",
    records.plans[0].id,
  );
  expect(JSON.stringify(data)).not.toContain("Demonstrative metadata");
  expect(repo.append).not.toHaveBeenCalled();
  mocks.plan.mockResolvedValue({ plan: null });
  const blocked = await readPatientHistory(repo, patientId, "PLAN_AVAILABLE");
  expect(blocked.plans).toEqual([]);
  expect(blocked.events.some((e) => e.kind === "PLAN_PUBLISHED")).toBe(false);
});

it("does not load a different patient's plan through the history reader", async () => {
  const { repo, patientId, records } = setup();
  records.plans.push({
    ...records.plans[0],
    id: "other-plan",
    patientId: "other",
  });
  await readPatientHistory(repo, patientId, "PLAN_AVAILABLE");
  expect(mocks.plan).toHaveBeenCalledTimes(1);
  await expect(
    readPatientHistory(repo, "other", "PLAN_AVAILABLE"),
  ).rejects.toThrow();
});
