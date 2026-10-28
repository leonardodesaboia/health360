import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("../../../server/demo/session", () => ({ getDemoSession: getSession }));
import { GET } from "./route";

describe("demo presenter state", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it("returns no case without a session and disables caching", async () => {
    getSession.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      session: null,
      preparedStatesAvailable: true,
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("reports prepared starting points as unavailable outside mock mode", async () => {
    vi.stubEnv("LLM_PROVIDER", "openai");
    getSession.mockResolvedValue(null);
    const body = await (await GET()).json();
    expect(body.preparedStatesAvailable).toBe(false);
  });

  it("does not reveal Jordan's examination date before the intake asks for it", async () => {
    getSession.mockResolvedValue({
      caseId: "repeat-screening",
      patient: { displayName: "Jordan Example" },
    });
    const { session } = await (await GET()).json();
    expect(session.summary).toBe(
      "Synthetic, age 60 · Reports a previous normal colonoscopy",
    );
    expect(session.summary).not.toMatch(/2022|Nov/);
  });

  it("returns only the synthetic presenter fields, never scope or clinical records", async () => {
    getSession.mockResolvedValue({
      caseId: "first-screening",
      datasetId: "private-dataset",
      patientId: "private-patient",
      patient: { displayName: "Alex Example", id: "private-patient" },
      profile: { personalHistory: ["private-history"] },
      examinations: ["private-exam"],
    });
    const response = await GET();
    expect(await response.json()).toEqual({
      session: {
        caseId: "first-screening",
        displayName: "Alex Example",
        summary:
          "Synthetic, age 50 · No previous colorectal screening reported",
      },
      preparedStatesAvailable: true,
    });
  });

  it("returns a generic uncached 503 when session storage fails", async () => {
    getSession.mockRejectedValue(new Error("postgresql://secret@private/db"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("exposes only the allowlisted prepared point label with demonstrative copy", async () => {
    getSession.mockResolvedValue({
      caseId: "first-screening",
      preparedStateId: "alex-plan-v1",
      datasetId: "private-dataset",
      patient: { displayName: "Alex Example" },
    });
    const response = await GET();
    const { session: body } = await response.json();
    expect(body.preparedStateId).toBe("alex-plan-v1");
    expect(body.summary).toContain("Alex — reviewed plan v1");
    expect(body.summary).toContain("DEMONSTRATIVE — NOT CLINICALLY VALIDATED");
    expect(body).not.toHaveProperty("datasetId");
    expect(body).not.toHaveProperty("profile");
  });
});
