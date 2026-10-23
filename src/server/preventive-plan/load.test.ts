import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  database: vi.fn(),
  transaction: vi.fn(),
  read: vi.fn(),
  disconnect: vi.fn(),
}));
vi.mock("../demo/session", () => ({ getDemoSession: mocks.session }));
vi.mock("../db/client", () => ({ createDatabase: mocks.database }));
vi.mock("../db/repository", () => ({
  inDatasetTransaction: mocks.transaction,
}));
vi.mock("./reader", () => ({ readPatientPlan: mocks.read }));
import { loadPatientPlan } from "./load";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.database.mockReturnValue({ $disconnect: mocks.disconnect });
  mocks.transaction.mockImplementation(async (_db, _dataset, operation) =>
    operation("scoped-repository"),
  );
});

it("does not access storage without a trusted demo session", async () => {
  mocks.session.mockResolvedValue(null);
  expect(await loadPatientPlan()).toBeNull();
  expect(mocks.database).not.toHaveBeenCalled();
});

it("uses the session dataset and patient rather than a client supplied scope", async () => {
  mocks.session.mockResolvedValue({
    datasetId: "dataset-a",
    patientId: "patient-a",
    caseId: "first-screening",
  });
  mocks.read.mockResolvedValue({
    status: "MEDICAL_REVIEW_PENDING",
    plan: null,
  });
  await loadPatientPlan();
  expect(mocks.transaction).toHaveBeenCalledWith(
    expect.anything(),
    "dataset-a",
    expect.any(Function),
  );
  expect(mocks.read).toHaveBeenCalledWith("scoped-repository", "patient-a");
  expect(mocks.disconnect).toHaveBeenCalledOnce();
});

it("surfaces storage failure to the error boundary and closes its connection", async () => {
  mocks.session.mockResolvedValue({
    datasetId: "dataset-a",
    patientId: "patient-a",
  });
  mocks.read.mockRejectedValue(new Error("Storage unavailable"));
  await expect(loadPatientPlan()).rejects.toThrow("Storage unavailable");
  expect(mocks.disconnect).toHaveBeenCalledOnce();
});
