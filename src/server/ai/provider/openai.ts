import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { analysisOutputSchema } from "../schemas/analysis";
import type { LlmProvider, ProviderRequest, ProviderResult } from "./types";

export class OpenAIProvider implements LlmProvider {
  readonly id = "openai";
  constructor(
    readonly model: string,
    private readonly client: OpenAI,
  ) {}
  async generate(request: ProviderRequest): Promise<ProviderResult> {
    try {
      const response = await this.client.responses.parse(
        {
          model: this.model,
          store: false,
          instructions: request.system,
          input: request.input,
          max_output_tokens: 6000,
          text: {
            format: zodTextFormat(
              analysisOutputSchema,
              "health360_analysis_v1",
            ),
          },
        },
        { signal: request.signal, maxRetries: 0 },
      );
      if (
        response.output.some(
          (item) =>
            item.type === "message" &&
            item.content.some((content) => content.type === "refusal"),
        )
      ) {
        return { ok: false, reason: "refused" };
      }
      if (response.status !== "completed" || !response.output_parsed) {
        return { ok: false, reason: "invalid_output" };
      }
      // Return only structured content, never reasoning items or raw SDK metadata.
      return { ok: true, data: response.output_parsed };
    } catch (error) {
      if (
        request.signal.aborted ||
        error instanceof OpenAI.APIConnectionTimeoutError
      ) {
        return { ok: false, reason: "timeout" };
      }
      return {
        ok: false,
        reason:
          error instanceof SyntaxError || error instanceof z.ZodError
            ? "invalid_output"
            : "api_error",
      };
    }
  }
}
