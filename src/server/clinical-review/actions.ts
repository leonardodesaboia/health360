"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDatabase } from "../db/client";
import { getDemoSession } from "../demo/session";
import { recordReview } from "./decisions";

export type ReviewActionState = {
  status: "idle" | "saved" | "finalized" | "clarification" | "error";
  message: string;
  reviewVersion?: number;
};

export async function saveReviewAction(
  _previous: ReviewActionState,
  form: FormData,
): Promise<ReviewActionState> {
  try {
    const session = await getDemoSession();
    if (!session)
      return {
        status: "error",
        message: "Select a demonstration case before saving a review.",
      };
    const id = z.string().min(1).max(512).parse(form.get("workspaceId"));
    const payload = z.string().max(100000).parse(form.get("payload"));
    const intent = z.enum(["save", "finalize"]).parse(form.get("intent"));
    const input = JSON.parse(payload) as unknown;
    const submission = z
      .object({
        expectedReviewVersion: z.number().int().min(0),
        decisions: z.array(z.unknown()).max(100),
      })
      .strict()
      .parse(input);
    const db = getDatabase();
    const review = await recordReview(db, session, id, {
      ...submission,
      intent,
    });
    revalidatePath("/doctor");
    revalidatePath("/patient/plan");
    revalidatePath(`/doctor/reviews/${encodeURIComponent(id)}`);
    const clarification = review.decisions.some(
      (d) => d.decision === "CLARIFY",
    );
    return {
      status: review.completedAt
        ? "finalized"
        : clarification
          ? "clarification"
          : "saved",
      reviewVersion: review.version,
      message: review.completedAt
        ? "Demonstration review finalized and reviewed plan published."
        : clarification
          ? "Clarification requested. This review remains incomplete and requires a new analysis."
          : "Demonstration decisions saved. Review finalization is still required.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof z.ZodError
          ? (error.issues[0]?.message ?? "Check the review inputs.")
          : "The review could not be saved. Reload to check current versions and try again.",
    };
  }
}
