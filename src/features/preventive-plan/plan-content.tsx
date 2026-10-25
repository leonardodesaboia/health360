import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
} from "lucide-react";
import type { PreventivePlan } from "../patients/contracts";
import { Notice, Surface } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";

export function PlanContent({
  plan,
  previous = false,
}: {
  plan: PreventivePlan;
  previous?: boolean;
}) {
  const formattedPublishedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(plan.publishedAt));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-success p-5 text-success-foreground">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0"
            />
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase">
                {previous
                  ? "Historical Reviewed Record"
                  : "Physician-Reviewed & Approved Follow-Up Plan"}
              </p>
              <p className="mt-1 text-base font-semibold">
                {previous
                  ? `Preserved Plan Version ${plan.version}`
                  : "Reviewed by Dr. Helena Rostand (Synthetic Reviewer ID: demo-physician-rostand)"}
              </p>
              <p className="mt-1 text-xs">
                Plan v<span className="tabular-nums">{plan.version}</span> ·
                Published{" "}
                <time dateTime={plan.publishedAt} className="tabular-nums">
                  {formattedPublishedDate}
                </time>{" "}
                · Profile v
                <span className="tabular-nums">{plan.profileVersion}</span> ·
                Review v
                <span className="tabular-nums">{plan.reviewVersion}</span>
              </p>
            </div>
          </div>
          <span className="rounded-sm border border-current/25 bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
            Provenance: Physician-reviewed
          </span>
        </div>
      </div>

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
      </Notice>

      <Surface className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Recommended Preventive Opportunities
            </p>
            <h2 className="mt-1">Selected actions</h2>
          </div>
          <span className="rounded-sm bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            Provenance: Physician-reviewed
          </span>
        </div>

        {plan.actions.length ? (
          <ul className="mt-4 space-y-4">
            {plan.actions.map((action) => (
              <li
                key={action.proposalId}
                className="rounded-lg border bg-background p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-primary"
                    />
                    <div>
                      <p className="font-semibold">{action.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Approved during demonstration physician review for
                        average-risk preventive follow-up.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    <Clock aria-hidden="true" className="size-3.5" />
                    {
                      {
                        PENDING: "Not started",
                        COMPLETED: "Completed",
                        DEFERRED: "Deferred",
                      }[action.status]
                    }
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No actions were selected in this review.
          </p>
        )}
      </Surface>

      <Surface className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Evaluated & Filtered Examinations · Do Not Test Intelligence
            </p>
            <h2 className="mt-1">Reviewed possible redundancies</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            Do Not Test · Filtered by System
          </span>
        </div>

        {plan.reviewedRedundancies.length ? (
          <ul className="mt-4 space-y-4">
            {plan.reviewedRedundancies.map((text, index) => (
              <li
                key={index}
                className="rounded-lg border bg-success p-4 text-success-foreground"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-card px-2.5 py-1 text-xs font-semibold text-success-foreground">
                    <ShieldCheck aria-hidden="true" className="size-3.5" />
                    SPARED / FILTERED EXAMINATION
                  </span>
                  <span className="text-xs font-medium">
                    Provenance: Rule + Physician-reviewed
                  </span>
                </div>
                <p className="mt-3 font-semibold">{text}</p>
                <div className="mt-3 grid gap-2 border-t border-current/15 pt-3 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-semibold">Clinical reason: </span>
                    Previous normal, complete colonoscopy reported within the
                    recommended 10-year guideline interval.
                  </div>
                  <div>
                    <span className="font-semibold">Patient protection: </span>
                    Avoids unnecessary repeat bowel preparation, sedation and
                    procedural risks without clinical indication.
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No possible redundancies were included in this review.
          </p>
        )}
      </Surface>

      <Surface>
        <h2>Information to confirm</h2>
        <TextItems
          items={plan.pendingInformation}
          empty="No information requests were included in this review."
        />
      </Surface>

      <Surface>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2>Next steps</h2>
          <Button asChild variant="outline">
            <Link href="/patient/history">
              <History aria-hidden="true" className="size-4" />
              View longitudinal history & reassessment
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-sm">
          Use the reviewed actions and filtered redundancy notices above to
          track this demonstration follow-up. New clinical information or
          symptoms require a reassessment cycle and physician review before a
          new plan version is published.
        </p>
        <dl className="mt-4 grid gap-2 border-t pt-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <dt className="inline font-medium">Plan version: </dt>
            <dd className="inline tabular-nums">{plan.version}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Published: </dt>
            <dd className="inline tabular-nums">
              <time dateTime={plan.publishedAt}>{formattedPublishedDate}</time>
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
      </Surface>
    </div>
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
