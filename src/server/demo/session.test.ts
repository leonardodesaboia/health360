import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  cookies: vi.fn(),
  database: vi.fn(),
  load: vi.fn(),
  replace: vi.fn(),
  reset: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("../db/client", () => ({ getDatabase: mocks.database }));
vi.mock("./store", () => ({
  loadDemoCase: mocks.load,
  replaceDemoDataset: mocks.replace,
  resetDemoDataset: mocks.reset,
}));
import {
  getDemoSession,
  selectDemoCaseForSession,
  resetDemoSession,
} from "./session";
import { loadClinicalContext } from "../clinical-rules/context";
import { demoSessionCookie } from "./contracts";
import { demoCaseRecords, demoDatasetId } from "./records";
const token = "a".repeat(43);
beforeEach(() => {
  vi.resetAllMocks();
  mocks.cookies.mockResolvedValue({ get: mocks.get, set: mocks.set });
  mocks.database.mockReturnValue({});
  vi.stubEnv("DEMO_COOKIE_SECURE", "false");
});
afterEach(() => vi.unstubAllEnvs());

describe("cookie-bound demo session", () => {
  it.each([undefined, "false", "true"])(
    "requires a secure cookie in production even with DEMO_COOKIE_SECURE=%s",
    async (configured) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEMO_COOKIE_SECURE", configured);
      await selectDemoCaseForSession("first-screening");
      expect(mocks.set).toHaveBeenCalledWith(
        demoSessionCookie,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          secure: true,
        }),
      );
    },
  );
  it("returns null without a valid cookie and never touches storage", async () => {
    expect(await getDemoSession()).toBeNull();
    mocks.get.mockReturnValue({ value: "invalid" });
    expect(await getDemoSession()).toBeNull();
    expect(await resetDemoSession()).toBe(false);
    expect(mocks.database).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("returns the stored case with a server-derived dataset and current patient", async () => {
    mocks.get.mockReturnValue({ value: token });
    const records = demoCaseRecords("repeat-screening");
    const stored = {
      clinicalContext: loadClinicalContext("repeat-screening", 1),
      caseId: "repeat-screening",
      patient: records.patient,
      profile: records.profile,
      examinations: records.examination,
    };
    mocks.load.mockResolvedValue(stored);
    expect(await getDemoSession()).toEqual({
      ...stored,
      datasetId: demoDatasetId(token),
      patientId: records.patient.id,
    });
    expect(mocks.load).toHaveBeenCalledWith({}, demoDatasetId(token));
    expect(mocks.set).not.toHaveBeenCalled();
    mocks.load.mockResolvedValue(null);
    expect(await getDemoSession()).toBeNull();
  });
  it("propagates a storage error without a fixture fallback or session write", async () => {
    mocks.get.mockReturnValue({ value: token });
    mocks.load.mockRejectedValue(new Error("Storage unavailable"));
    await expect(getDemoSession()).rejects.toThrow("Storage unavailable");
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("rejects unknown case IDs before cookies or database writes", async () => {
    await expect(selectDemoCaseForSession("foreign-case")).rejects.toThrow();
    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.database).not.toHaveBeenCalled();
  });
  it("creates an opaque httpOnly cookie only after case storage succeeds", async () => {
    await selectDemoCaseForSession("first-screening");
    const [name, value, options] = mocks.set.mock.calls[0];
    expect(name).toBe(demoSessionCookie);
    expect(value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(options).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
    });
    expect(mocks.replace).toHaveBeenCalledWith(
      {},
      demoDatasetId(value),
      "first-screening",
    );
    expect(mocks.replace.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.set.mock.invocationCallOrder[0],
    );
  });
  it("keeps existing browser scope and honors HTTPS cookie configuration", async () => {
    vi.stubEnv("DEMO_COOKIE_SECURE", "true");
    mocks.get.mockReturnValue({ value: token });
    await selectDemoCaseForSession("repeat-screening");
    expect(mocks.replace).toHaveBeenCalledWith(
      {},
      demoDatasetId(token),
      "repeat-screening",
    );
    expect(mocks.set).toHaveBeenCalledWith(
      demoSessionCookie,
      token,
      expect.objectContaining({ secure: true }),
    );
    mocks.reset.mockResolvedValue(true);
    expect(await resetDemoSession()).toBe(true);
    expect(mocks.reset).toHaveBeenCalledWith({}, demoDatasetId(token));
  });
  it("does not issue a cookie when persistence fails", async () => {
    mocks.replace.mockRejectedValue(new Error("Storage unavailable"));
    await expect(selectDemoCaseForSession("first-screening")).rejects.toThrow(
      "Storage unavailable",
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
