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
  it("returns no records when case replacement expires the session snapshot", async () => {
    mocks.workflowStatus.mockRejectedValue(
      new Error("Patient not found in dataset"),
    );
    const list = vi.fn().mockResolvedValue([]);
    mocks.repository.mockReturnValue({ list });
    expect(await getReviewQueue()).toEqual([]);
    expect(await getReviewWorkspace("old-analysis--v1")).toBeNull();
    expect(list.mock.calls.every(([kind]) => kind === "patient")).toBe(true);
  });
  it("does not hide workflow read failures while the scoped patient still exists", async () => {
    mocks.workflowStatus.mockRejectedValue(
      new Error("Workflow storage unavailable"),
    );
    mocks.repository.mockReturnValue({
      list: vi.fn().mockResolvedValue(readerFixture().patients),
    });
    await expect(getReviewQueue()).rejects.toThrow(
      "Workflow storage unavailable",
    );
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
