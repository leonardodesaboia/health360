import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  database: vi.fn(),
  disconnect: vi.fn(),
  analyze: vi.fn(),
  config: vi.fn(),
  revalidate: vi.fn(),
  status: vi.fn(),
}));
vi.mock("../demo/session", () => ({ getDemoSession: mocks.session }));
vi.mock("../db/client", () => ({ getDatabase: mocks.database }));
vi.mock("./service", () => ({ analyzeSession: mocks.analyze }));
vi.mock("../ai/provider/config", () => ({ configuredProvider: mocks.config }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("../workflow/state", () => ({
  getWorkflowStatus: mocks.status,
  transitionWorkflow: vi.fn(),
}));
import { analyzeCurrentDemo } from "./actions";
import { getAnalysisPageState } from "./read";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue(null);
  mocks.disconnect.mockResolvedValue(undefined);
  mocks.database.mockReturnValue({ $disconnect: mocks.disconnect });
  mocks.config.mockReturnValue(null);
});

describe("cookie-bound analysis entry points", () => {
  it("rejects a missing demo session before opening storage or selecting a provider", async () => {
    expect(await analyzeCurrentDemo()).toEqual({ status: "NO_SESSION" });
    expect(mocks.database).not.toHaveBeenCalled();
    expect(mocks.config).not.toHaveBeenCalled();
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it("passes only the resolved cookie session to the service", async () => {
    const session = {
      datasetId: "cookie-dataset",
      patientId: "cookie-patient",
      caseId: "first-screening",
    };
    mocks.session.mockResolvedValue(session);
    mocks.analyze.mockResolvedValue({
      status: "RECORDED",
      analysisId: "analysis",
      workflowStatus: "ANALYSIS_FAILED",
    });
    expect(await analyzeCurrentDemo()).toMatchObject({ status: "RECORDED" });
    const call = mocks.analyze.mock.calls[0];
    expect(call[1]).toEqual(session);
    expect(await call[2].explain({})).toEqual({
      status: "BLOCKED",
      reason: "configuration",
    });
    expect(mocks.disconnect).not.toHaveBeenCalled();
    expect(mocks.revalidate).toHaveBeenCalledWith("/doctor");
  });
  it("returns bounded errors without database/provider details", async () => {
    mocks.session.mockRejectedValue(new Error("SECRET database details"));
    expect(await analyzeCurrentDemo()).toEqual({ status: "UNAVAILABLE" });
  });
  it("the patient reader returns only workflow status, never analysis records", async () => {
    mocks.session.mockResolvedValue({
      datasetId: "dataset",
      patientId: "patient",
      caseId: "first-screening",
    });
    mocks.status.mockResolvedValue("MEDICAL_REVIEW_PENDING");
    expect(await getAnalysisPageState()).toEqual({
      status: "MEDICAL_REVIEW_PENDING",
      unavailable: false,
      outcome: null,
    });
    expect(mocks.status).toHaveBeenCalledWith(
      mocks.database.mock.results[0].value,
      "dataset",
      "patient",
    );
    expect(mocks.analyze).not.toHaveBeenCalled();
    expect(mocks.disconnect).not.toHaveBeenCalled();
  });
  it("reads an empty state without storage when no demo session exists", async () => {
    expect(await getAnalysisPageState()).toEqual({
      status: null,
      unavailable: false,
    });
    expect(mocks.database).not.toHaveBeenCalled();
  });
});
