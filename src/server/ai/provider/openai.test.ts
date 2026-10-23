import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { analyze } from "../analyze";
import { configuredProvider } from "./config";

const input = {
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
};
const output = {
  summary: "Synthetic case.",
  relevantInformation: [],
  missingInformation: ["age"],
  proposals: [],
  uncertainties: ["Unknown age."],
  reviewQuestions: ["Clarify age?"],
};
function sdkResponse(content: unknown, status = "completed") {
  return new Response(
    JSON.stringify({
      id: "response_test",
      object: "response",
      created_at: 1,
      status,
      output: [
        {
          id: "message_test",
          type: "message",
          role: "assistant",
          status: "completed",
          content: [content],
        },
      ],
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}
const jsonContent = (value: unknown) => ({
  type: "output_text",
  text: JSON.stringify(value),
  annotations: [],
});
function setup(fetch: typeof globalThis.fetch) {
  const config = configuredProvider(
    {
      LLM_PROVIDER: "openai",
      LLM_MODEL: "configured-test-model",
      OPENAI_API_KEY: "synthetic-test-key",
      LLM_TIMEOUT_MS: "500",
    },
    fetch,
  );
  if (!config) throw new Error("Test configuration invalid");
  return config;
}
describe("official OpenAI SDK boundary with local HTTP stubs", () => {
  it("uses configured model, strict schema, store:false, no tools and no identifiers", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(sdkResponse(jsonContent(output)));
    const { provider, timeoutMs } = setup(fetch);
    expect(await analyze(input, provider, timeoutMs)).toMatchObject({
      status: "NEEDS_REVIEW",
      meta: { provider: "openai", model: "configured-test-model" },
    });
    const request = fetch.mock.calls[0];
    const body = JSON.parse(String(request[1]?.body));
    expect(body).toMatchObject({
      model: "configured-test-model",
      store: false,
      text: {
        format: {
          type: "json_schema",
          strict: true,
          name: "health360_analysis_v1",
        },
      },
    });
    expect(body).not.toHaveProperty("tools");
    expect(body).not.toHaveProperty("reasoning");
    expect(body.input).not.toMatch(/patientId|displayName|synthetic-test-key/);
    expect(body.text.format.schema.required).toContain("reviewQuestions");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each([
    [() => sdkResponse({ type: "refusal", refusal: "Refused." }), "refused"],
    [() => sdkResponse(jsonContent(output), "incomplete"), "invalid_output"],
    [
      () => sdkResponse({ type: "output_text", text: "{bad", annotations: [] }),
      "invalid_output",
    ],
    [() => sdkResponse(jsonContent({ summary: "partial" })), "invalid_output"],
    [
      () =>
        new Response(
          JSON.stringify({
            error: { message: "raw secret", type: "server_error" },
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        ),
      "api_error",
    ],
  ] as const)(
    "blocks SDK failures without raw output or automatic retry",
    async (response, reason) => {
      const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async () => response());
      const { provider, timeoutMs } = setup(fetch);
      expect(await analyze(input, provider, timeoutMs)).toEqual({
        status: "BLOCKED",
        reason,
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );
});
