import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { analyze, analyzeFromEnv } from "./analyze";
import { MockProvider } from "./provider/mock";
import type { LlmProvider } from "./provider/types";

export const input = {
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
    evidence: [
      {
        id: "demo-evidence",
        version: 1,
        title: "Synthetic test evidence",
        issuer: "Test fixture",
        year: 2026,
        sourceUrl: "https://example.org/test-only",
        excerpt: "Test fixture only.",
        status: "supported",
      },
    ],
    allowedProposals: [
      {
        ruleId: "demo-rule",
        category: "PREVENTIVE_OPPORTUNITY",
        evidenceIds: ["demo-evidence"],
      },
    ],
  },
};
export const output = {
  summary: "Synthetic case with unknown age.",
  relevantInformation: [],
  missingInformation: ["age"],
  uncertainties: ["Age is unknown."],
  reviewQuestions: ["Clarify age?"],
  proposals: [
    {
      category: "PREVENTIVE_OPPORTUNITY",
      title: "Review demonstrative finding",
      rationale: "Explain supplied deterministic finding.",
      ruleIds: ["demo-rule"],
      evidenceIds: ["demo-evidence"],
      consideredData: ["age unknown"],
      uncertainties: ["Demonstrative only."],
    },
  ],
};
const run = (value: unknown = output) =>
  analyze(input, new MockProvider({ ok: true, data: value }), 100);
afterEach(() => vi.useRealTimers());

describe("synthetic analysis boundary", () => {
  it("returns preliminary AI provenance and version metadata requiring physician review", async () => {
    const result = await run();
    expect(result).toMatchObject({
      status: "NEEDS_REVIEW",
      provenance: "AI_GENERATED",
      validation: "demonstrative",
      meta: {
        profileVersion: 1,
        contextVersion: 1,
        promptVersion: 1,
        provider: "mock",
        model: "deterministic-v1",
      },
    });
    expect(result).not.toHaveProperty("publishedAt");
  });
  it("preserves missing information in the deterministic mock", async () => {
    const result = await analyzeFromEnv(input, {
      LLM_PROVIDER: "mock",
      LLM_MODEL: "deterministic-v1",
    });
    expect(result).toMatchObject({
      status: "NEEDS_REVIEW",
      data: { missingInformation: ["age"] },
    });
  });
  it("projects out identifiers and preserves unknown facts", async () => {
    const generate = vi
      .fn<LlmProvider["generate"]>()
      .mockResolvedValue({ ok: true, data: output });
    await analyze(
      {
        ...input,
        patientId: "secret-id",
        examinations: [
          {
            id: "exam-secret",
            patientId: "patient-secret",
            name: "Synthetic exam",
            performedAt: null,
            result: { value: null, provenance: "PATIENT_REPORTED" },
            notes: "secret notes",
          },
        ],
        profile: {
          ...input.profile,
          id: "profile-secret",
          patientId: "patient-secret",
          displayName: "Private name",
        },
      },
      { id: "test", model: "test-model", generate },
      100,
    );
    const request = generate.mock.calls[0][0];
    expect(request.input).not.toMatch(
      /secret|Private name|patientId|displayName/,
    );
    expect(JSON.parse(request.input).profile.age).toBeNull();
    expect(JSON.parse(request.input).examinations[0]).toEqual({
      name: "Synthetic exam",
      performedAt: null,
      result: { value: null, provenance: "PATIENT_REPORTED" },
    });
    expect(request.system).toContain("Never diagnose");
    expect(request.system).toContain("DEMONSTRATIVE");
  });
  it.each([
    {},
    { ...output, summary: undefined },
    { ...output, chainOfThought: "private" },
    "{bad json",
    {
      ...output,
      proposals: [{ ...output.proposals[0], category: "DIAGNOSIS" }],
    },
  ])("blocks malformed, partial or unsupported output", async (value) => {
    expect(await run(value)).toEqual({
      status: "BLOCKED",
      reason: "invalid_output",
    });
  });
  it.each(["invented", ""])(
    "blocks unknown or missing evidence",
    async (id) => {
      expect(
        await run({
          ...output,
          proposals: [{ ...output.proposals[0], evidenceIds: [id] }],
        }),
      ).toMatchObject({ status: "BLOCKED" });
    },
  );
  it("blocks placeholder evidence and proposals outside deterministic scope", async () => {
    expect(
      await analyze(
        {
          ...input,
          context: {
            ...input.context,
            evidence: [{ ...input.context.evidence[0], status: "placeholder" }],
          },
        },
        new MockProvider({ ok: true, data: output }),
        100,
      ),
    ).toEqual({ status: "BLOCKED", reason: "unsupported_evidence" });
    expect(
      await run({
        ...output,
        proposals: [{ ...output.proposals[0], ruleIds: ["blocked-rule"] }],
      }),
    ).toEqual({ status: "BLOCKED", reason: "unsupported_scope" });
  });
  it("rejects real-data and invalid input before invoking a provider", async () => {
    const generate = vi.fn();
    expect(
      await analyze(
        { ...input, synthetic: false },
        { id: "test", model: "test", generate },
        100,
      ),
    ).toEqual({ status: "BLOCKED", reason: "invalid_input" });
    expect(generate).not.toHaveBeenCalled();
  });
  it.each(["api_error", "refused", "invalid_output"] as const)(
    "maps %s without raw provider content",
    async (reason) => {
      expect(
        await analyze(input, new MockProvider({ ok: false, reason }), 100),
      ).toEqual({ status: "BLOCKED", reason });
    },
  );
  it("catches unexpected provider exceptions without leaking secrets", async () => {
    const provider: LlmProvider = {
      id: "broken",
      model: "broken",
      generate: async () => {
        throw new Error("secret raw response");
      },
    };
    expect(await analyze(input, provider, 100)).toEqual({
      status: "BLOCKED",
      reason: "api_error",
    });
  });
  it("bounds even a noncooperative provider and aborts the request", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const provider: LlmProvider = {
      id: "hang",
      model: "hang",
      generate: (request) => {
        signal = request.signal;
        return new Promise(() => {});
      },
    };
    const pending = analyze(input, provider, 10);
    await vi.advanceTimersByTimeAsync(10);
    expect(await pending).toEqual({ status: "BLOCKED", reason: "timeout" });
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each([0, NaN, Infinity, 120001])(
    "rejects unbounded timeout %s",
    async (timeout) => {
      expect(await analyze(input, new MockProvider(), timeout)).toEqual({
        status: "BLOCKED",
        reason: "configuration",
      });
    },
  );
  it("selects mock explicitly and blocks invalid OpenAI configuration", async () => {
    expect(
      await analyzeFromEnv(input, {
        LLM_PROVIDER: "mock",
        LLM_MODEL: "deterministic-v1",
        OPENAI_API_KEY: "",
      }),
    ).toMatchObject({ status: "NEEDS_REVIEW" });
    for (const env of [
      {},
      { LLM_PROVIDER: "other" },
      { LLM_PROVIDER: "openai", LLM_MODEL: "configured" },
      { LLM_PROVIDER: "mock", LLM_MODEL: "test", LLM_TIMEOUT_MS: "invalid" },
    ]) {
      expect(await analyzeFromEnv(input, env)).toEqual({
        status: "BLOCKED",
        reason: "configuration",
      });
    }
  });
});
