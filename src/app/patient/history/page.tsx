import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import {
  EmptyState,
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { ReassessmentButton } from "@/features/health-timeline/reassessment-button";
import { loadPatientHistory } from "@/server/health-timeline/load";
import { startReassessment } from "@/server/health-timeline/actions";

export default async function History({
  searchParams,
}: {
  searchParams: Promise<{ update?: string | string[] }>;
}) {
  const data = await loadPatientHistory();
  const latest = data?.plans[0];
  const canUpdate =
    data?.status === "PLAN_AVAILABLE" &&
    latest?.profileVersion === data.latestProfileVersion;
  const canResume =
    data?.status === "REASSESSMENT_PENDING" ||
    data?.status === "INTAKE_IN_PROGRESS";
  const unavailable = (await searchParams).update === "unavailable";
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="History"
        title="Your follow-up history"
        description="Recorded events and reviewed plan versions for your selected synthetic case."
      />
      {data ? (
        <>
          <StatusIndicator status={data.status} />
          {unavailable && (
            <Notice title="This update could not be started" tone="warning">
              Your evaluation may have changed or storage may be unavailable.
              Reload this page before trying again. Your previous plan has been
              preserved.
            </Notice>
          )}
          <Surface>
            <h2>Update your information</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An update starts another evaluation. Your earlier reviewed plan
              stays in history while new information goes through analysis and
              physician review.
            </p>
            {canUpdate && latest ? (
              <form action={startReassessment} className="mt-4">
                <input type="hidden" name="planId" value={latest.id} />
                <input
                  type="hidden"
                  name="profileVersion"
                  value={data.latestProfileVersion}
                />
                <ReassessmentButton />
              </form>
            ) : canResume ? (
              <Button asChild className="mt-4">
                <Link href="/patient/intake">
                  Continue updating information
                </Link>
              </Button>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Complete the current evaluation and physician review before
                starting another update.
              </p>
            )}
          </Surface>
          <section aria-labelledby="plan-history-title">
            <h2 id="plan-history-title">Reviewed plan versions</h2>
            {data.plans.length ? (
              <ul className="mt-4 divide-y rounded-lg border bg-card px-6">
                {data.plans.map((plan, index) => (
                  <li key={plan.id} className="py-4">
                    <Link
                      href={`/patient/history/${encodeURIComponent(plan.id)}`}
                      className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
                    >
                      View plan version {plan.version}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {index === 0 &&
                      data.status === "PLAN_AVAILABLE" &&
                      plan.profileVersion === data.latestProfileVersion
                        ? "Current reviewed plan"
                        : "Previous reviewed plan"}{" "}
                      ·{" "}
                      <time dateTime={plan.publishedAt}>
                        {date(plan.publishedAt)}
                      </time>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Physician-reviewed · Profile version {plan.profileVersion}{" "}
                      · Review version {plan.reviewVersion}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No reviewed plan has been published for this case.
              </p>
            )}
          </section>
          <section aria-labelledby="timeline-title">
            <h2 id="timeline-title">Recorded events</h2>
            {data.events.length ? (
              <ol className="mt-4 space-y-4 border-l pl-6">
                {data.events.map((event) => (
                  <li key={event.id}>
                    <h3>{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      <time dateTime={event.occurredAt}>
                        {date(event.occurredAt)}
                      </time>{" "}
                      · Version {event.entityVersion}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.provenanceLabel}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No events have been recorded for this case yet.
              </p>
            )}
          </section>
        </>
      ) : (
        <EmptyState
          title="Select a demonstration case"
          description="Choose a synthetic case from Home to view its recorded history."
          action={
            <Button asChild variant="outline">
              <Link href="/patient">Go to Home</Link>
            </Button>
          }
        />
      )}
    </ContentContainer>
  );
}

function date(value: string) {
  return (
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value)) + " UTC"
  );
}
