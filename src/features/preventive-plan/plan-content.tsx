import type { PreventivePlan } from "../patients/contracts";
import { Notice, Surface } from "@/components/shared/primitives";

export function PlanContent({
  plan,
  previous = false,
}: {
  plan: PreventivePlan;
  previous?: boolean;
}) {
  return (
    <>
      <Notice
        title={
          previous ? "Previous reviewed plan" : "Reviewed demonstration plan"
        }
      >
        <p>
          {previous
            ? "This earlier plan has been preserved. It reflects the information and review recorded for that version."
            : "This plan contains only decisions from the finalized demonstration physician review."}
        </p>
        <p className="mt-2">
          Demo reviewer decisions are not clinical validation.
        </p>
        <dl className="mt-4 grid gap-2 text-sm">
          <div>
            <dt className="inline font-medium">Plan version: </dt>
            <dd className="inline tabular-nums">{plan.version}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Published: </dt>
            <dd className="inline tabular-nums">
              <time dateTime={plan.publishedAt}>
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeZone: "UTC",
                }).format(new Date(plan.publishedAt))}
              </time>{" "}
              UTC
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Source: </dt>
            <dd className="inline">
              Physician-reviewed · Review version {plan.reviewVersion} · Profile
              version {plan.profileVersion}
            </dd>
          </div>
        </dl>
      </Notice>
      <Surface>
        <h2>Selected actions</h2>
        {plan.actions.length ? (
          <ul className="mt-4 space-y-4">
            {plan.actions.map((action) => (
              <li key={action.proposalId}>
                <p>{action.text}</p>
                <p className="text-sm text-muted-foreground">
                  {
                    {
                      PENDING: "Not started",
                      COMPLETED: "Completed",
                      DEFERRED: "Deferred",
                    }[action.status]
                  }
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No actions were selected in this review.
          </p>
        )}
      </Surface>
      <Surface>
        <h2>Reviewed possible redundancies</h2>
        <TextItems
          items={plan.reviewedRedundancies}
          empty="No possible redundancies were included in this review."
        />
      </Surface>
      <Surface>
        <h2>Information to confirm</h2>
        <TextItems
          items={plan.pendingInformation}
          empty="No information requests were included in this review."
        />
      </Surface>
      <Surface>
        <h2>Next steps</h2>
        <p className="mt-4 text-sm">
          Action tracking is not available in this demonstration. New
          information requires another analysis and physician review before a
          new plan is available.
        </p>
      </Surface>
    </>
  );
}

function TextItems({ items, empty }: { items: string[]; empty: string }) {
  return items.length ? (
    <ul className="mt-4 list-inside list-disc space-y-2 text-sm">
      {items.map((text, index) => (
        <li key={index}>{text}</li>
      ))}
    </ul>
  ) : (
    <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
  );
}
