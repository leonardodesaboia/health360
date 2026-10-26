import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  database: vi.fn(),
  record: vi.fn(),
  disconnect: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("../demo/session", () => ({ getDemoSession: mocks.session }));
vi.mock("../db/client", () => ({ getDatabase: mocks.database }));
vi.mock("./decisions", () => ({ recordReview: mocks.record }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { saveReviewAction } from "./actions";

function form(payload: unknown = { expectedReviewVersion: 0, decisions: [] }) {
  const data = new FormData();
  data.set("workspaceId", "synthetic-analysis--v1");
  data.set("payload", JSON.stringify(payload));
  data.set("intent", "finalize");
  return data;
}
describe("review action boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue({
      datasetId: "server-dataset",
      caseId: "first-screening",
      patientId: "server-patient",
    });
    mocks.database.mockReturnValue({ $disconnect: mocks.disconnect });
    mocks.record.mockResolvedValue({
      version: 1,
      completedAt: "2026-10-23T00:00:00Z",
      decisions: [],
    });
  });
  it("rejects missing session without creating a database", async () => {
    mocks.session.mockResolvedValue(null);
    expect(
      await saveReviewAction({ status: "idle", message: "" }, form()),
    ).toMatchObject({ status: "error" });
    expect(mocks.database).not.toHaveBeenCalled();
  });
  it("handles session storage failure without leaking details or creating a database", async () => {
    mocks.session.mockRejectedValue(new Error("Sensitive session SQL details"));
    const result = await saveReviewAction(
      { status: "idle", message: "" },
      form(),
    );
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("Sensitive");
    expect(mocks.database).not.toHaveBeenCalled();
    expect(mocks.record).not.toHaveBeenCalled();
  });
  it("rejects forged reviewer, status and malformed payloads before mutation", async () => {
    for (const value of [
      { expectedReviewVersion: 0, decisions: [], reviewerId: "forged" },
      {
        expectedReviewVersion: 0,
        decisions: [],
        status: "MEDICAL_REVIEW_COMPLETED",
      },
      [],
    ]) {
      expect(
        await saveReviewAction({ status: "idle", message: "" }, form(value)),
      ).toMatchObject({ status: "error" });
    }
    const malformed = form();
    malformed.set("payload", "not-json");
    expect(
      await saveReviewAction({ status: "idle", message: "" }, malformed),
    ).toMatchObject({ status: "error" });
    expect(mocks.record).not.toHaveBeenCalled();
  });
  it("uses server session and refreshes the physician routes only after persistence", async () => {
    const result = await saveReviewAction(
      { status: "idle", message: "" },
      form(),
    );
    expect(result).toMatchObject({ status: "finalized", reviewVersion: 1 });
    expect(mocks.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        datasetId: "server-dataset",
        patientId: "server-patient",
      }),
      "synthetic-analysis--v1",
      { expectedReviewVersion: 0, decisions: [], intent: "finalize" },
    );
    expect(mocks.revalidate).toHaveBeenCalledWith("/doctor");
    expect(mocks.revalidate).toHaveBeenCalledWith("/patient/plan");
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });
  it("does not expose database errors or claim success on persistence failure", async () => {
    mocks.record.mockRejectedValue(new Error("Sensitive SQL details"));
    const result = await saveReviewAction(
      { status: "idle", message: "" },
      form(),
    );
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("Sensitive SQL");
    expect(mocks.revalidate).not.toHaveBeenCalled();
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });
});
