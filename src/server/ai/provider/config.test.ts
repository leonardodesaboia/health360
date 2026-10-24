import { describe, expect, it, vi } from "vitest";
import { configuredProvider } from "./config";

describe("offline demo configuration", () => {
  it("defaults to mock without credentials or provider configuration", () => {
    expect(configuredProvider({})?.provider.id).toBe("mock");
  });

  it("forces mock even if a key is present, without a network request", () => {
    const fetch = vi.fn();
    expect(
      configuredProvider(
        { LLM_PROVIDER: "mock", OPENAI_API_KEY: "unused" },
        fetch,
      )?.provider.id,
    ).toBe("mock");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps explicit OpenAI without a key blocked", () => {
    expect(
      configuredProvider({ LLM_PROVIDER: "openai", LLM_MODEL: "configured" }),
    ).toBeNull();
  });
});
