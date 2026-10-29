import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  db: vi.fn(),
  tx: vi.fn(),
  history: vi.fn(),
  plan: vi.fn(),
  disconnect: vi.fn(),
  status: vi.fn(),
}));
vi.mock("../demo/session", () => ({ getDemoSession: mocks.session }));
vi.mock("../db/client", () => ({ getDatabase: mocks.db }));
vi.mock("../db/repository", () => ({ inDatasetTransaction: mocks.tx }));
vi.mock("./reader", () => ({ readPatientHistory: mocks.history }));
vi.mock("../preventive-plan/reader", () => ({ readPatientPlan: mocks.plan }));
vi.mock("../workflow/state", () => ({ getWorkflowStatus: mocks.status }));
import { loadHistoricalPlan, loadPatientHistory } from "./load";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.db.mockReturnValue({ $disconnect: mocks.disconnect });
  mocks.tx.mockImplementation(async (_db, _dataset, operation) =>
    operation("dataset-repository", "transaction"),
  );
  mocks.status.mockResolvedValue("PLAN_AVAILABLE");
});

it("never reads data without the selected demo session", async () => {
  mocks.session.mockResolvedValue(null);
  expect(await loadPatientHistory()).toBeNull();
  expect(await loadHistoricalPlan("arbitrary-id")).toBeNull();
  expect(mocks.db).not.toHaveBeenCalled();
});

it("scopes history and historical URLs to the session dataset and patient", async () => {
  mocks.session.mockResolvedValue({
    datasetId: "dataset-a",
    patientId: "patient-a",
  });
  mocks.plan.mockResolvedValue({ plan: null });
  await loadPatientHistory();
  expect(mocks.history).toHaveBeenCalledWith(
    "dataset-repository",
    "patient-a",
    "PLAN_AVAILABLE",
  );
  expect(await loadHistoricalPlan("foreign-plan-id")).toEqual({ plan: null });
  expect(mocks.plan).toHaveBeenCalledWith(
    "dataset-repository",
    "patient-a",
    "PLAN_AVAILABLE",
    "foreign-plan-id",
  );
  expect(mocks.tx).toHaveBeenCalledWith(
    expect.anything(),
    "dataset-a",
    expect.any(Function),
  );
  expect(mocks.disconnect).not.toHaveBeenCalled();
});

it("fails explicitly on storage errors without disconnecting another reader", async () => {
  mocks.session.mockResolvedValue({
    datasetId: "dataset-a",
    patientId: "patient-a",
  });
  mocks.history.mockRejectedValue(new Error("Storage unavailable"));
  await expect(loadPatientHistory()).rejects.toThrow("Storage unavailable");
  expect(mocks.disconnect).not.toHaveBeenCalled();
});
