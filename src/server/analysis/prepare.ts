import "server-only";
import { z } from "zod";
import {
  aiAnalysisSchema,
  analysisFailureReasonSchema,
  type AIAnalysis,
} from "../../features/patients/contracts";
import {
  DEMONSTRATIVE_LABEL,
  type ScreeningInput,
} from "../clinical-rules/contracts";
import { loadClinicalContext } from "../clinical-rules/context";
import { evaluateScreening } from "../clinical-rules/evaluate";
import { analysisOutputSchema } from "../ai/schemas/analysis";
import { minimizeInput } from "./input";
import { validateProposals } from "./validate";

const responseSchema = z.object({
  status: z.literal("NEEDS_REVIEW"),
  data: analysisOutputSchema,
  meta: aiAnalysisSchema.pick({
    provider: true,
    model: true,
    promptVersion: true,
    promptId: true,
    profileVersion: true,
    contextVersion: true,
  }),
});
export type AnalysisIdentity = Pick<
  AIAnalysis,
  | "id"
  | "version"
  | "createdAt"
  | "provider"
  | "model"
  | "promptVersion"
  | "promptId"
>;
export type Explanation = (
  input: ReturnType<typeof minimizeInput>,
) => Promise<unknown>;
export type PreparedAnalysis = {
  analysis: AIAnalysis;
  to: "ANALYSIS_FAILED" | "CLARIFICATION_REQUIRED" | "MEDICAL_REVIEW_PENDING";
};

/** Pure orchestration boundary; persistence must still check current versions atomically. */
export async function prepareAnalysis(
  input: ScreeningInput,
  identity: AnalysisIdentity,
  explain: Explanation,
): Promise<PreparedAnalysis> {
  const context = loadClinicalContext(input.scenarioId, input.contextVersion);
  const rules = evaluateScreening(input);
  const base: AIAnalysis = {
    ...identity,
    patientId: input.profile.patientId,
    profileVersion: input.profile.version,
    contextId: context.id,
    contextVersion: context.version,
    summary: `${DEMONSTRATIVE_LABEL}. Rule-generated: ${rules.reason}.`,
    relevantInformation: rules.consideredData,
    missingInformation: rules.missingFields,
    uncertainties: rules.limitations,
    reviewQuestions: [],
    proposals: [],
    status: "BLOCKED",
    failureReason:
      rules.status === "NEEDS_CLARIFICATION"
        ? "missing_information"
        : rules.status === "OUT_OF_SCOPE"
          ? "out_of_scope"
          : "invalid_input",
  };
  if (rules.status === "NEEDS_CLARIFICATION") {
    return {
      analysis: aiAnalysisSchema.parse({
        ...base,
        summary: `${DEMONSTRATIVE_LABEL}. Required information needs clarification.`,
        reviewQuestions: rules.missingFields,
      }),
      to: "CLARIFICATION_REQUIRED",
    };
  }
  if (rules.status !== "READY_FOR_REVIEW")
    return { analysis: aiAnalysisSchema.parse(base), to: "ANALYSIS_FAILED" };
  try {
    const raw = await explain(minimizeInput(input.profile, rules, context));
    const failed = (
      failureReason: AIAnalysis["failureReason"],
    ): PreparedAnalysis => ({
      analysis: aiAnalysisSchema.parse({
        ...base,
        summary: `${DEMONSTRATIVE_LABEL}. System-generated: Analysis could not be completed. Retry the analysis.`,
        failureReason,
      }),
      to: "ANALYSIS_FAILED",
    });
    const blocked = z
      .object({
        status: z.literal("BLOCKED"),
        reason: analysisFailureReasonSchema,
      })
      .safeParse(raw);
    if (blocked.success) return failed(blocked.data.reason);
    const parsed = responseSchema.safeParse(raw);
    if (!parsed.success) return failed("invalid_output");
    if (
      parsed.data.meta.profileVersion !== input.profile.version ||
      parsed.data.meta.contextVersion !== context.version
    )
      return failed("stale_input");
    if (!validateProposals(parsed.data.data.proposals, rules))
      return failed("unsupported_scope");
    const { data, meta } = parsed.data;
    const preliminary: AIAnalysis = {
      ...base,
      ...data,
      ...meta,
      summary: `${DEMONSTRATIVE_LABEL}. Preliminary proposal, awaiting physician review. ${data.summary}`,
      relevantInformation: [
        ...new Set([...rules.consideredData, ...data.relevantInformation]),
      ],
      missingInformation: [
        ...new Set([...rules.missingFields, ...data.missingInformation]),
      ],
      uncertainties: [
        ...new Set([...rules.limitations, ...data.uncertainties]),
      ],
      proposals: data.proposals.map((proposal, index) => ({
        ...proposal,
        id: `${identity.id}-proposal-${index + 1}`,
        analysisId: identity.id,
        consideredData: rules.consideredData,
        uncertainties: [
          ...new Set([...rules.limitations, ...proposal.uncertainties]),
        ],
        provenance: "AI_GENERATED",
        ruleReferences: rules.findings
          .filter(
            (finding) =>
              finding.category === proposal.category &&
              proposal.ruleIds.includes(finding.ruleId),
          )
          .map((finding) => ({
            ruleId: finding.ruleId,
            ruleVersion: finding.ruleVersion,
            evidenceVersion: finding.evidenceVersion,
            validation: "demonstrative" as const,
            rationale: finding.rationale,
          })),
      })),
      status: "PRELIMINARY",
    };
    delete preliminary.failureReason;
    const analysis = aiAnalysisSchema.parse(preliminary);
    return { analysis, to: "MEDICAL_REVIEW_PENDING" };
  } catch {
    return {
      analysis: aiAnalysisSchema.parse({
        ...base,
        summary: `${DEMONSTRATIVE_LABEL}. System-generated: Analysis could not be completed. Retry the analysis.`,
        failureReason: "api_error",
      }),
      to: "ANALYSIS_FAILED",
    };
  }
}
