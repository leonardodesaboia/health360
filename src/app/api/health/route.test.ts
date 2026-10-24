import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { query, connect, end, construct } = vi.hoisted(() => ({
  query: vi.fn(),
  connect: vi.fn(),
  end: vi.fn(),
  construct: vi.fn(),
}));
vi.mock("pg", () => ({
  Client: class {
    constructor() {
      construct();
    }
    query = query;
    connect = connect;
    end = end;
  },
}));

import { GET } from "./route";

describe("deployment readiness", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("DATABASE_URL", "postgresql://synthetic@localhost/demo");
    end.mockResolvedValue(undefined);
  });

  it("checks the database and disables caching", async () => {
    query.mockResolvedValue([{ "?column?": 1 }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(query).toHaveBeenCalledOnce();
    expect(query).toHaveBeenCalledWith("SELECT 1");
    expect(end).toHaveBeenCalledOnce();
  });

  it("returns a generic unavailable response without leaking database errors", async () => {
    query.mockRejectedValue(new Error("postgresql://secret@private-host/db"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(end).toHaveBeenCalledOnce();
  });

  it("fails closed when the database is not configured", async () => {
    vi.stubEnv("DATABASE_URL", "");
    expect((await GET()).status).toBe(503);
    expect(connect).not.toHaveBeenCalled();
  });

  it("returns unavailable and closes the client when connection fails", async () => {
    connect.mockRejectedValue(new Error("connection timeout"));
    expect((await GET()).status).toBe(503);
    expect(query).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledOnce();
  });

  it("returns a generic 503 if the database URL cannot be parsed", async () => {
    construct.mockImplementationOnce(() => {
      throw new Error("invalid secret connection URL");
    });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
    expect(connect).not.toHaveBeenCalled();
  });
});
