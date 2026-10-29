"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Notice } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { fields } from "../health-intake/contracts";
import type { MedicalReview } from "../patients/contracts";
import {
  workspaceId,
  reviewableProposals,
  type ReviewWorkspace,
} from "./reader";
import {
  saveReviewAction,
  type ReviewActionState,
} from "@/server/clinical-review/actions";

const choices = [
  ["PENDING", "Leave pending"],
  ["APPROVE", "Approve"],
  ["MODIFY", "Modify"],
  ["REJECT", "Reject"],
  ["CLARIFY", "Request clarification"],
] as const;
type Decision = MedicalReview["decisions"][number];
const initialState: ReviewActionState = { status: "idle", message: "" };
const controlClass =
  "min-h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

async function submitReview(
  previous: ReviewActionState,
  form: FormData,
): Promise<ReviewActionState> {
  try {
    return await saveReviewAction(previous, form);
  } catch {
    return {
      status: "error",
      message:
        "We could not confirm the result. Reload this review to check its recorded status.",
      reviewVersion: previous.reviewVersion,
    };
  }
}

export function DecisionForm({ workspace }: { workspace: ReviewWorkspace }) {
  const { analysis, review, stale, workflowStatus } = workspace;
  const proposals = reviewableProposals(analysis);
  const [decisions, setDecisions] = useState(() =>
    proposals.map((p) => {
      const saved = review?.decisions.find((d) => d.proposalId === p.id);
      return {
        proposalId: p.id,
        decision: saved?.decision ?? ("PENDING" as Decision["decision"]),
        reason: saved?.reason ?? "",
        revisedText: saved?.revisedText ?? null,
        clarification: saved?.clarification ?? null,
      };
    }),
  );
  const [state, action, pending] = useActionState(submitReview, initialState);
  const [submittedIntent, setSubmittedIntent] = useState("save");
  const finalized =
    Boolean(review?.completedAt) || state.status === "finalized";
  const locked =
    pending ||
    finalized ||
    stale ||
    analysis.status === "BLOCKED" ||
    !proposals.length ||
    state.status === "clarification" ||
    !["MEDICAL_REVIEW_PENDING", "MEDICAL_REVIEW_IN_PROGRESS"].includes(
      workflowStatus,
    );
  const incompleteCount = decisions.filter((d) =>
    ["PENDING", "CLARIFY"].includes(d.decision),
  ).length;
  const incomplete = incompleteCount > 0;
  const hasClarify = decisions.some((d) => d.decision === "CLARIFY");
  const published =
    state.status === "finalized" ||
    (Boolean(review?.completedAt) &&
      !stale &&
      workflowStatus === "PLAN_AVAILABLE");
  const readOnly = locked && !pending;
  const clarificationRequested =
    workflowStatus === "CLARIFICATION_REQUIRED" ||
    state.status === "clarification";
  const reviewVersion = state.reviewVersion ?? review?.version;
  function update(index: number, value: Partial<(typeof decisions)[number]>) {
    setDecisions((current) =>
      current.map((d, i) => (i === index ? { ...d, ...value } : d)),
    );
  }
  return (
    <section
      aria-labelledby="physician-decisions-heading"
      className="rounded-lg border bg-card p-6 text-card-foreground"
    >
      <h2
        id="physician-decisions-heading"
        tabIndex={-1}
        className="scroll-mt-6"
      >
        Physician decisions
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Demo reviewer — not a real clinician (demo-physician). These synthetic
        decisions do not provide clinical validation.
      </p>
      <p className="mt-2 text-xs text-muted-foreground tabular-nums">
        Analysis v{analysis.version} ·{" "}
        {reviewVersion ? `Review v${reviewVersion}` : "No saved review yet"}
      </p>
      {readOnly && (
        <div className="mt-4">
          {finalized ? (
            <Notice
              title={
                published
                  ? "Review finalized. Reviewed demonstration plan published."
                  : "Review finalized. Check plan status."
              }
            >
              This review is finalized and cannot be changed. The decisions
              below are read-only.
              <p className="mt-3">
                Demo role navigation only; no sign-in or authorization.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/patient/plan">View patient plan</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/doctor">Back to queue</Link>
                </Button>
              </div>
            </Notice>
          ) : clarificationRequested ? (
            <Notice title="Clarification requested" tone="warning">
              Updated information and a new analysis are required before review
              can continue.
            </Notice>
          ) : (
            <Notice title="Decisions unavailable" tone="warning">
              Decisions are unavailable for this analysis. Reload the current
              case to check its versions and workflow.
            </Notice>
          )}
        </div>
      )}
      <form
        action={action}
        onSubmit={(event) => {
          const submitter = (event.nativeEvent as SubmitEvent).submitter;
          setSubmittedIntent(
            submitter instanceof HTMLButtonElement ? submitter.value : "save",
          );
        }}
        onReset={(event) => {
          // Server Actions reset native controls; keep visible selections aligned with the controlled draft.
          event.preventDefault();
        }}
        aria-label="Review proposal decisions"
        className="mt-6 space-y-6"
        aria-describedby="review-help review-feedback"
        aria-busy={pending}
      >
        <input type="hidden" name="workspaceId" value={workspaceId(analysis)} />
        <input
          type="hidden"
          name="payload"
          value={JSON.stringify({
            expectedReviewVersion: state.reviewVersion ?? review?.version ?? 0,
            decisions,
          })}
        />
        <fieldset disabled={locked} className="space-y-6">
          <legend className="sr-only">
            Decisions for analysis version {analysis.version}
          </legend>
          {decisions.map((d, index) => (
            <div key={d.proposalId} className="space-y-3 border-t pt-6">
              <p className="text-xs text-muted-foreground tabular-nums">
                Proposal {index + 1} of {decisions.length}
              </p>
              <h3>{proposals[index].title}</h3>
              <label
                className="block text-sm font-medium"
                htmlFor={`decision-${index}`}
              >
                Decision for proposal {index + 1}
              </label>
              <select
                id={`decision-${index}`}
                className={controlClass}
                aria-describedby="review-help review-feedback"
                value={d.decision}
                onChange={(e) =>
                  update(index, {
                    decision: e.target.value as Decision["decision"],
                    clarification:
                      e.target.value === "CLARIFY"
                        ? (d.clarification ?? { question: "" })
                        : null,
                  })
                }
              >
                {choices.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <label
                className="block text-sm font-medium"
                htmlFor={`reason-${index}`}
              >
                Reason for proposal {index + 1}
                {["MODIFY", "REJECT"].includes(d.decision)
                  ? " (required)"
                  : " (optional)"}
              </label>
              <textarea
                id={`reason-${index}`}
                className={controlClass}
                aria-describedby="review-help review-feedback"
                rows={3}
                maxLength={4000}
                value={d.reason}
                required={["MODIFY", "REJECT"].includes(d.decision)}
                onChange={(e) => update(index, { reason: e.target.value })}
              />
              {d.decision === "MODIFY" && (
                <>
                  <label
                    className="block text-sm font-medium"
                    htmlFor={`revised-${index}`}
                  >
                    Revised text for proposal {index + 1} (required)
                  </label>
                  <textarea
                    id={`revised-${index}`}
                    className={controlClass}
                    aria-describedby="review-help review-feedback"
                    rows={3}
                    maxLength={8000}
                    required
                    value={d.revisedText ?? ""}
                    onChange={(e) =>
                      update(index, { revisedText: e.target.value })
                    }
                  />
                </>
              )}
              {d.decision === "CLARIFY" && (
                <>
                  <label
                    className="block text-sm font-medium"
                    htmlFor={`question-${index}`}
                  >
                    Question for the patient, in plain English (required)
                  </label>
                  <textarea
                    id={`question-${index}`}
                    className={controlClass}
                    aria-describedby="review-help review-feedback"
                    rows={2}
                    maxLength={500}
                    required
                    value={d.clarification?.question ?? ""}
                    onChange={(e) =>
                      update(index, {
                        clarification: {
                          ...d.clarification,
                          question: e.target.value,
                        },
                      })
                    }
                  />
                  <label
                    className="block text-sm font-medium"
                    htmlFor={`target-${index}`}
                  >
                    Related intake question (optional)
                  </label>
                  <select
                    id={`target-${index}`}
                    className={controlClass}
                    aria-describedby="review-help review-feedback"
                    value={d.clarification?.targetField ?? ""}
                    onChange={(e) =>
                      update(index, {
                        clarification: {
                          question: d.clarification?.question ?? "",
                          ...(e.target.value
                            ? { targetField: e.target.value }
                            : {}),
                        },
                      })
                    }
                  >
                    <option value="">No specific intake question</option>
                    {fields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              name="intent"
              value="save"
              variant={hasClarify ? "default" : "outline"}
            >
              {hasClarify ? "Send clarification request" : "Save decisions"}
            </Button>
            <Button
              type="submit"
              name="intent"
              value="finalize"
              disabled={incomplete}
              variant={hasClarify ? "outline" : "default"}
            >
              Finalize review
            </Button>
          </div>
        </fieldset>
        {!readOnly && (
          <p
            className="text-sm tabular-nums"
            aria-live="polite"
            aria-label="Draft decision completeness"
          >
            {incomplete
              ? `${incompleteCount.toLocaleString("en-US")} of ${decisions.length.toLocaleString("en-US")} proposals still need a decision.`
              : "Decisions entered. Finalization checks are still required."}
          </p>
        )}
        {!readOnly && hasClarify && (
          <p className="text-sm">
            Sends the question to the patient and requires updated information
            and a new analysis. This does not publish a plan. Selecting Request
            clarification alone sends nothing.
          </p>
        )}
        <p id="review-help" className="text-sm text-muted-foreground">
          {readOnly
            ? "Decisions are read-only in this state."
            : incomplete
              ? "Finalize review becomes available when every proposal is approved, modified or rejected. A clarification request keeps the review incomplete and returns the case for updated information and analysis."
              : "Selecting a decision only edits the draft. Save decisions records a review version; publication requires successful server finalization checks."}
        </p>
        <p
          id="review-feedback"
          role={state.status === "error" ? "alert" : "status"}
          className="text-sm"
        >
          {pending
            ? submittedIntent === "finalize"
              ? "Finalizing review…"
              : "Saving decisions…"
            : state.message}
        </p>
      </form>
    </section>
  );
}
