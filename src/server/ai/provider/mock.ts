import "server-only";
import { z } from "zod";
import { analysisInputSchema } from "../schemas/analysis";
import type { LlmProvider, ProviderRequest, ProviderResult } from "./types";

export class MockProvider implements LlmProvider {
  readonly id = "mock";
  constructor(
    private readonly result?: ProviderResult,
    readonly model = "deterministic-v1",
  ) {}
  async generate(request: ProviderRequest): Promise<ProviderResult> {
    if (this.result) return structuredClone(this.result);
    const input = z
      .object({ profile: analysisInputSchema.shape.profile })
      .parse(JSON.parse(request.input));
    return {
      ok: true,
      data: {
        summary: "Synthetic demonstration awaiting physician review.",
        relevantInformation: [],
        missingInformation: input.profile.missingInformation,
        proposals: [],
        uncertainties: ["DEMONSTRATIVE — NOT CLINICALLY VALIDATED."],
        reviewQuestions: ["Review the supplied facts and missing information."],
      },
    };
  }
}
