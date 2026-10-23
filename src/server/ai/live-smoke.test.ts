import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { analyzeFromEnv } from "./analyze";

// Intentionally outside regular CI verification; opt in only with synthetic data.
// No clinical recommendations or evidence are requested by this connectivity check.
it.skipIf(process.env.LLM_LIVE_SMOKE !== "1" || !!process.env.CI)(
  "connects to the explicitly configured live provider with synthetic minimal data",
  async () => {
    expect(process.env.LLM_PROVIDER).toBe("openai");
    expect(process.env.OPENAI_API_KEY).toBeTruthy();
    const result = await analyzeFromEnv({
      synthetic: true,
      profileVersion: 1,
      profile: {
        age: null,
        personalHistory: [],
        familyHistory: [],
        medications: [],
        habits: [],
        missingInformation: ["age"],
      },
      context: {
        version: 1,
        validation: "demonstrative",
        evidence: [],
        allowedProposals: [],
      },
    });
    expect(result.status).toBe("NEEDS_REVIEW");
    if (result.status === "NEEDS_REVIEW")
      expect(result.data.proposals).toEqual([]);
  },
  125000,
);
