import { beforeEach, describe, expect, it, vi } from "vitest";
import { readerFixture } from "../../../tests/fixtures/clinical-review";
import { workspaceId } from "../../features/clinical-review/reader";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  repository: vi.fn(),
  database: vi.fn(),
  disconnect: vi.fn(),
  workflowStatus: vi.fn(),
}));
vi.mock("../demo/session", () => ({ getDemoSession: mocks.session }));
vi.mock("../db/client", () => ({ createDatabase: mocks.database }));
vi.mock("../workflow/state", () => ({
  getWorkflowStatus: mocks.workflowStatus,
}));
vi.mock("../db/repository", () => ({ datasetRepository: mocks.repository }));
import { getReviewQueue, getReviewWorkspace } from "./reader";

describe("dataset-scoped physician reader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(mocks.disconnect).toHaveBeenCalledOnce();
    mocks.session.mockResolvedValue({
      datasetId: "other-dataset",
      patientId: "other-patient",
    });
    expect(await getReviewWorkspace(workspaceId(data.analyses[0]))).toBeNull();
  });
  it("propagates storage failure and closes the connection without fixture fallback", async () => {
    mocks.repository.mockReturnValue({
      list: vi.fn().mockRejectedValue(new Error("Storage unavailable")),
    });
    await expect(getReviewQueue()).rejects.toThrow("Storage unavailable");
    expect(mocks.disconnect).toHaveBeenCalledOnce();
  });
});
