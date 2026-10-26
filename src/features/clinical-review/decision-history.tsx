import { Surface } from "@/components/shared/primitives";
import { fields } from "../health-intake/contracts";
import type { ReviewWorkspace } from "./reader";

const decisionLabels = {
  APPROVE: "Approved",
  MODIFY: "Modified",
  REJECT: "Rejected",
  PENDING: "Pending",
  CLARIFY: "Clarification requested",
} as const;

/** Read-only, append-only history of the demo reviewer's saved review versions. */
export function DecisionHistory({ workspace }: { workspace: ReviewWorkspace }) {
  const { reviewHistory, analysis } = workspace;
  const title = (proposalId: string) =>
    analysis.proposals.find((p) => p.id === proposalId)?.title ??
    "Proposal not in this analysis";
  return (
    <Surface>
      <h2 id="decision-history-heading">Decision history</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Saved versions are immutable. Reviewer: demo reviewer — not a real
        clinician. Recorded decisions are not clinical validation.
      </p>
      {reviewHistory.length === 0 ? (
        <p className="mt-4 text-sm">No decisions have been saved yet.</p>
      ) : (
        <ol
          aria-labelledby="decision-history-heading"
          className="mt-4 space-y-4"
        >
          {reviewHistory.map((review) => (
            <li key={review.version} className="border-t pt-4 text-sm">
              <p className="font-medium">
                Review v{review.version} ·{" "}
                {review.completedAt
                  ? `Finalized ${auditTime(review.completedAt)}`
                  : "Draft — not finalized"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Demo reviewer ({review.reviewerId}) · Analysis v
                {review.analysisVersion} · Recorded{" "}
                {auditTime(review.decisions[0]?.recordedAt ?? "")}
              </p>
              <ul className="mt-2 space-y-2 break-words">
                {review.decisions.map((d) => {
                  const target = fields.find(
                    (f) => f.id === d.clarification?.targetField,
                  );
                  return (
                    <li key={d.proposalId}>
                      <span className="font-medium">
                        {title(d.proposalId)}:
                      </span>{" "}
                      {decisionLabels[d.decision]}
                      {d.reason && <p>Reason: {d.reason}</p>}
                      {d.revisedText && <p>Revised text: {d.revisedText}</p>}
                      {d.clarification && (
                        <p>
                          Question for the patient: {d.clarification.question}
                          {target && ` (intake question: ${target.label})`}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </Surface>
  );
}

function auditTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "time unavailable";
  return (
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(date) + " UTC"
  );
}
