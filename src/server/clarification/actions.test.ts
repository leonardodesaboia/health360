import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  database: vi.fn(),
  save: vi.fn(),
  resume: vi.fn(),
  revalidate: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("../demo/session", () => ({ getDemoSession: mocks.session }));
vi.mock("../db/client", () => ({ getDatabase: mocks.database }));
vi.mock("./service", () => ({ saveClarificationAnswers: mocks.save }));
vi.mock("../analysis/run", () => ({ resumeAnalysisForSession: mocks.resume }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { submitClarification } from "./actions";
import { StaleStateError } from "../workflow/state";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue(null);
  mocks.database.mockReturnValue({ database: true });
  mocks.redirect.mockImplementation(() => {
    throw new Error("redirected");
  });
});
it("rejects a missing cookie session without storage or analysis access", async () => {
  expect(await submitClarification({ datasetId: "client-scope" })).toEqual({
    status: "NO_SESSION",
  });
  expect(mocks.database).not.toHaveBeenCalled();
  expect(mocks.resume).not.toHaveBeenCalled();
});
it("passes only cookie scope and invokes the exported analysis service after saved answers", async () => {
  const session = {
    datasetId: "cookie-dataset",
    patientId: "cookie-patient",
    caseId: "first-screening",
  };
  mocks.session.mockResolvedValue(session);
  mocks.save.mockResolvedValue({
    profileVersion: 3,
    reservationId: "reservation",
  });
  mocks.resume.mockResolvedValue({ status: "RECORDED" });
  const input = { answers: { age: null } };
  await expect(submitClarification(input)).rejects.toThrow("redirected");
  expect(mocks.save).toHaveBeenCalledWith(
    { database: true },
    "cookie-dataset",
    "cookie-patient",
    input,
  );
  expect(mocks.resume).toHaveBeenCalledWith({ database: true }, session);
  expect(mocks.save.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.resume.mock.invocationCallOrder[0],
  );
  expect(mocks.redirect).toHaveBeenCalledWith("/patient/analysis");
});
it("does not rerun analysis for stale answers", async () => {
  mocks.session.mockResolvedValue({
    datasetId: "dataset",
    patientId: "patient",
  });
  mocks.save.mockRejectedValue(new StaleStateError());
  expect(await submitClarification({})).toEqual({ status: "STALE" });
  expect(mocks.resume).not.toHaveBeenCalled();
});
it("returns bounded errors after interrupted analysis and refreshes recovery state", async () => {
  mocks.session.mockResolvedValue({
    datasetId: "dataset",
    patientId: "patient",
  });
  mocks.save.mockResolvedValue({});
  mocks.resume.mockRejectedValue(
    new Error("PRIVATE database/provider details"),
  );
  expect(await submitClarification({})).toEqual({ status: "UNAVAILABLE" });
  expect(mocks.revalidate).toHaveBeenCalledWith("/patient/clarification");
});
