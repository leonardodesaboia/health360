import { z } from "zod";
import { fieldIds } from "../health-intake/contracts";
import { medicalReviewSchema } from "../patients/contracts";
import { safeEvidenceUrl, type ReviewWorkspace } from "./reader";

export const decisionInputSchema = medicalReviewSchema.shape.decisions.element
  .omit({ recordedAt: true })
  .extend({
    reason: z.string().trim().max(4000),
    revisedText: z.string().trim().max(8000).nullable(),
    clarification: z
      .object({
        question: z.string().trim().max(500),
        targetField: z.enum(fieldIds).optional(),
      })
      .strict()
      .nullable()
      .default(null),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (["MODIFY", "REJECT"].includes(value.decision) && !value.reason) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "A reason is required for modification or rejection.",
      });
    }
    if (value.decision === "MODIFY" && !value.revisedText) {
      ctx.addIssue({
        code: "custom",
        path: ["revisedText"],
        message: "Revised text is required for modification.",
      });
    }
    if (value.decision === "CLARIFY" && !value.clarification?.question) {
      ctx.addIssue({
        code: "custom",
        path: ["clarification", "question"],
        message: "A plain-English question for the patient is required.",
      });
    }
    if (value.decision !== "CLARIFY" && value.clarification) {
      ctx.addIssue({
        code: "custom",
        path: ["clarification"],
        message: "Only clarification requests can include a patient question.",
      });
    }
  });

export const reviewSubmissionSchema = z
  .object({
    expectedReviewVersion: z.number().int().min(0),
    decisions: z.array(decisionInputSchema).max(100),
    intent: z.enum(["save", "finalize"]),
  })
  .strict();
export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>;

export function prepareReview(
  workspace: ReviewWorkspace,
  input: unknown,
  now: string,
  newId: string,
) {
  const submission = reviewSubmissionSchema.parse(input);
  const { analysis, review, context, stale } = workspace;
  if (review?.completedAt) throw new Error("This review is already finalized.");
  if ((review?.version ?? 0) !== submission.expectedReviewVersion)
    throw new Error("The review changed. Reload before saving.");
  if (stale)
    throw new Error(
      "Stale analysis: reload the current profile and analysis before reviewing.",
    );
  if (analysis.status !== "PRELIMINARY" || !analysis.proposals.length)
    throw new Error("This analysis is blocked or has no proposals.");
  const proposalIds = new Set(analysis.proposals.map((p) => p.id));
  const decisionIds = new Set(submission.decisions.map((d) => d.proposalId));
  if (
    proposalIds.size !== analysis.proposals.length ||
    decisionIds.size !== submission.decisions.length ||
    proposalIds.size !== decisionIds.size ||
    [...decisionIds].some((id) => !proposalIds.has(id))
  ) {
    throw new Error(
      "Every proposal requires exactly one decision; foreign proposals are not allowed.",
    );
  }
  for (const proposal of analysis.proposals) {
    if (
      proposal.analysisId !== analysis.id ||
      !proposal.ruleIds.length ||
      proposal.ruleIds.some((id) => !context.ruleIds.includes(id))
    )
      throw new Error("Unsupported rule reference.");
    if (
      !proposal.evidenceIds.length ||
      proposal.evidenceIds.some((id) => {
        const source = context.evidence.find((e) => e.id === id);
        return !source || !safeEvidenceUrl(source.sourceUrl);
      })
    )
      throw new Error(
        "Missing or placeholder evidence blocks review completion.",
      );
  }
  if (
    submission.intent === "finalize" &&
    submission.decisions.some(
      (d) => d.decision === "PENDING" || d.decision === "CLARIFY",
    )
  ) {
    throw new Error(
      "Pending decisions and clarification requests must be resolved before finalization.",
    );
  }
  return medicalReviewSchema.parse({
    id: review?.id ?? newId,
    version: (review?.version ?? 0) + 1,
    patientId: analysis.patientId,
    analysisId: analysis.id,
    analysisVersion: analysis.version,
    reviewerId: "demo-physician",
    completedAt: submission.intent === "finalize" ? now : null,
    decisions: submission.decisions.map((d) => ({
      ...d,
      revisedText: d.decision === "MODIFY" ? d.revisedText : null,
      clarification: d.decision === "CLARIFY" ? d.clarification : null,
      recordedAt: now,
    })),
  });
}
