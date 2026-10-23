import "server-only";
import { z } from "zod";
import {
  canTransition,
  workflowStatuses,
} from "../../features/workflow/workflow";
const status = z.enum(workflowStatuses);
export const workflowRefsSchema = z
  .object({
    profileVersion: z.number().int().positive().optional(),
    analysisId: z.string().min(1).optional(),
    reviewId: z.string().min(1).optional(),
    planId: z.string().min(1).optional(),
  })
  .strict();
const audit = {
  actor: z.enum(["patient", "system", "demo-physician"]),
  reason: z.string().min(1).optional(),
  refs: workflowRefsSchema.optional(),
};
export const workflowTransitionInputSchema = z
  .object({
    patientId: z.string().min(1),
    expectedFrom: status,
    expectedRefs: workflowRefsSchema.optional(),
    to: status,
    ...audit,
  })
  .strict();
export const workflowTransitionSchema = z
  .object({
    id: z.string().min(1),
    patientId: z.string().min(1),
    version: z.number().int().positive(),
    from: status,
    to: status,
    occurredAt: z.iso.datetime(),
    ...audit,
  })
  .strict()
  .refine((r) => canTransition(r.from, r.to), "Illegal workflow transition");
export type WorkflowTransitionInput = z.infer<
  typeof workflowTransitionInputSchema
>;
export type WorkflowTransition = z.infer<typeof workflowTransitionSchema>;
