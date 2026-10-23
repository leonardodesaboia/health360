import "server-only";
import {
  analysisInputSchema,
  analysisOutputSchema,
  type AnalysisOutput,
} from "./schemas/analysis";
import { buildPrompt, promptMetadata } from "./prompts/analysis-v1";
import { configuredProvider, timeoutSchema } from "./provider/config";
import type {
  FailureReason,
  LlmProvider,
  ProviderResult,
} from "./provider/types";

export type AnalysisResult =
  | { status: "BLOCKED"; reason: FailureReason }
  | {
      status: "NEEDS_REVIEW";
      provenance: "AI_GENERATED";
      validation: "demonstrative";
      data: AnalysisOutput;
      meta: {
        promptId: string;
        promptVersion: number;
        profileVersion: number;
        contextVersion: number;
        provider: string;
        model: string;
      };
    };
const blocked = (reason: FailureReason): AnalysisResult => ({
  status: "BLOCKED",
  reason,
});

export async function analyze(
  raw: unknown,
  provider: LlmProvider,
  timeoutMs: number,
): Promise<AnalysisResult> {
  if (!timeoutSchema.safeParse(timeoutMs).success)
    return blocked("configuration");
  const input = analysisInputSchema.safeParse(raw);
  if (!input.success) return blocked("invalid_input");
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<ProviderResult>((resolve) => {
      timer = setTimeout(() => {
        resolve({ ok: false, reason: "timeout" });
        controller.abort();
      }, timeoutMs);
    });
    const response = await Promise.race([
      provider.generate({
        ...buildPrompt(input.data),
        signal: controller.signal,
      }),
      deadline,
    ]);
    if (!response.ok) return blocked(response.reason);
    const parsed = analysisOutputSchema.safeParse(response.data);
    if (!parsed.success) return blocked("invalid_output");
    const context = input.data.context;
    for (const proposal of parsed.data.proposals) {
      if (
        proposal.evidenceIds.some(
          (id) =>
            !context.evidence.some(
              (e) =>
                e.id === id && e.status === "supported" && e.sourceUrl !== null,
            ),
        )
      ) {
        return blocked("unsupported_evidence");
      }
      if (
        proposal.ruleIds.some(
          (ruleId) =>
            !context.allowedProposals.some(
              (allowed) =>
                allowed.ruleId === ruleId &&
                allowed.category === proposal.category &&
                proposal.evidenceIds.every((id) =>
                  allowed.evidenceIds.includes(id),
                ),
            ),
        )
      ) {
        return blocked("unsupported_scope");
      }
    }
    return {
      status: "NEEDS_REVIEW",
      provenance: "AI_GENERATED",
      validation: "demonstrative",
      data: parsed.data,
      meta: {
        ...promptMetadata,
        profileVersion: input.data.profileVersion,
        contextVersion: context.version,
        provider: provider.id,
        model: provider.model,
      },
    };
  } catch {
    return blocked("api_error");
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
export async function analyzeFromEnv(
  raw: unknown,
  env: Record<string, string | undefined> = process.env,
): Promise<AnalysisResult> {
  const config = configuredProvider(env);
  return config
    ? analyze(raw, config.provider, config.timeoutMs)
    : blocked("configuration");
}
