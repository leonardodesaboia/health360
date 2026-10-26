import { z } from "zod";

export const clarificationRequestSchema = z
  .object({
    profileVersion: z.number().int().positive(),
    analysisId: z.string().min(1).max(200),
    answers: z.record(z.string().max(80), z.string().max(120).nullable()),
    freeAnswers: z
      .record(z.string().max(80), z.string().trim().min(1).max(2000).nullable())
      .optional(),
    reviewId: z.string().min(1).max(200).optional(),
    reviewVersion: z.number().int().positive().optional(),
  })
  .strict();
export type ClarificationRequest = z.infer<typeof clarificationRequestSchema>;
export type ClarificationActionResult = {
  status: "STALE" | "INVALID" | "UNAVAILABLE" | "NO_SESSION";
};
