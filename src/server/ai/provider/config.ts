import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import { MockProvider } from "./mock";
import { OpenAIProvider } from "./openai";
import type { LlmProvider } from "./types";

export const timeoutSchema = z.number().int().min(1).max(120000);
const configSchema = z
  .object({
    LLM_PROVIDER: z.enum(["openai", "mock"]).default("mock"),
    LLM_MODEL: z.string().trim().min(1).optional(),
    LLM_TIMEOUT_MS: z.coerce.number().pipe(timeoutSchema).default(30000),
    OPENAI_API_KEY: z.string().trim().optional(),
  })
  .refine(
    (env) =>
      env.LLM_PROVIDER !== "openai" ||
      (!!env.OPENAI_API_KEY && !!env.LLM_MODEL),
  );

export function configuredProvider(
  env: Record<string, string | undefined>,
  fetch?: typeof globalThis.fetch,
): { provider: LlmProvider; timeoutMs: number } | null {
  const config = configSchema.safeParse(env);
  if (!config.success) return null;
  const value = config.data;
  return {
    timeoutMs: value.LLM_TIMEOUT_MS,
    provider:
      value.LLM_PROVIDER === "mock"
        ? new MockProvider(undefined, value.LLM_MODEL ?? "deterministic-v1")
        : new OpenAIProvider(
            value.LLM_MODEL!,
            new OpenAI({
              apiKey: value.OPENAI_API_KEY,
              timeout: value.LLM_TIMEOUT_MS,
              maxRetries: 0,
              fetch,
            }),
          ),
  };
}
