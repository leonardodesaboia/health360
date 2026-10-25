import { z } from "zod";

export const clarificationRequestSchema = z
  .object({
    profileVersion: z.number().int().positive(),
    analysisId: z.string().min(1).max(200),
    answers: z.record(z.string().max(80), z.string().max(120).nullable()),
  })
  .strict();
export type ClarificationRequest = z.infer<typeof clarificationRequestSchema>;
export type ClarificationActionResult = {
  status: "STALE" | "INVALID" | "UNAVAILABLE" | "NO_SESSION";
};
