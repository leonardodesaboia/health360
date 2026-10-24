import { beforeEach, describe, expect, it, vi } from "vitest";
import { readerFixture } from "../../../tests/fixtures/clinical-review";
import { workspaceId } from "../../features/clinical-review/reader";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  repository: vi.fn(),
  database: vi.fn(),
  disconnect: vi.fn(),
  workflowStatus: vi.fn(),
  transaction: vi.fn(),
  tx: {},
}));
vi.mock("../demo/session", () => ({ getDemoSession: mocks.session }));
vi.mock("../db/client", () => ({ getDatabase: mocks.database }));
vi.mock("../workflow/state", () => ({
  getWorkflowStatus: mocks.workflowStatus,
}));
vi.mock("../db/repository", () => ({
  datasetRepository: mocks.repository,
  inDatasetTransaction: mocks.transaction,
}));
import { getReviewQueue, getReviewWorkspace } from "./reader";

describe("dataset-scoped physician reader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (db, datasetId, operation) =>
      operation(mocks.repository(db, datasetId), mocks.tx),
    );
    mocks.workflowStatus.mockResolvedValue("MEDICAL_REVIEW_PENDING");
    mocks.session.mockResolvedValue({
      datasetId: "demo-dataset",
      caseId: "first-screening",
      patientId: "synthetic-patient-01",
    });
    mocks.database.mockReturnValue({ $disconnect: mocks.disconnect });
  });
  it("never connects or returns records without a session", async () => {
    mocks.session.mockResolvedValue(null);
    expect(await getReviewQueue()).toEqual([]);
    expect(await getReviewWorkspace("anything")).toBeNull();
    expect(mocks.database).not.toHaveBeenCalled();
  });
  it("passes only the server session dataset to the repository", async () => {
    const data = readerFixture();
    const records = {
      patient: data.patients,
      profile: data.profiles,
      examination: data.examinations,
      analysis: data.analyses,
      context: data.contexts,
      review: data.reviews,
    };
    mocks.repository.mockReturnValue({
      list: vi.fn(async (kind: keyof typeof records) => records[kind]),
    });
    expect(
      await getReviewWorkspace(workspaceId(data.analyses[0])),
    ).toMatchObject({ patient: { id: "synthetic-patient-01" } });
    expect(mocks.repository).toHaveBeenCalledWith(
      expect.anything(),
      "demo-dataset",
    );
    expect(mocks.disconnect).not.toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.workflowStatus).toHaveBeenCalledWith(
      mocks.tx,
      "demo-dataset",
      "synthetic-patient-01",
    );
    mocks.session.mockResolvedValue({
      datasetId: "other-dataset",
      patientId: "other-patient",
    });
    expect(await getReviewWorkspace(workspaceId(data.analyses[0]))).toBeNull();
  });
  it("propagates storage failure without disconnecting the shared pool or using fixtures", async () => {
    mocks.repository.mockReturnValue({
      list: vi.fn().mockRejectedValue(new Error("Storage unavailable")),
    });
    await expect(getReviewQueue()).rejects.toThrow("Storage unavailable");
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });
  it("shows persisted workflow state rather than the initial patient snapshot", async () => {
    const data = readerFixture();
    const records = {
      patient: data.patients,
      profile: data.profiles,
      examination: data.examinations,
      analysis: data.analyses,
      context: data.contexts,
      review: data.reviews,
    };
    mocks.repository.mockReturnValue({
      list: vi.fn(async (kind: keyof typeof records) => records[kind]),
    });
    mocks.workflowStatus.mockResolvedValue("PLAN_AVAILABLE");
    const rows = await getReviewQueue();
    expect(rows[0].workflowStatus).toBe("PLAN_AVAILABLE");
    expect(data.patients[0].status).toBe("MEDICAL_REVIEW_PENDING");
  });
});
