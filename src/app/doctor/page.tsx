import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Notice, StatusIndicator } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { demoPatient, demoReview } from "@/features/patients/fixtures";
import { formatDate } from "@/lib/format";
export default function Queue() {
  return (
    <ContentContainer width="workspace">
      <PageHeader
        eyebrow="Physician workspace"
        title="Review queue"
        description="Organized context to support review. All records below are fictional."
      />
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="hidden grid-cols-[2fr_1fr_2fr_auto] gap-4 border-b bg-muted px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
          <span>Patient</span>
          <span>Example record</span>
          <span>Administrative stage</span>
          <span>Action</span>
        </div>
        <article className="grid items-center gap-4 p-6 md:grid-cols-[2fr_1fr_2fr_auto]">
          <div>
            <h2 className="text-base">{demoPatient.displayName}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Synthetic scenario · Profile v1
            </p>
          </div>
          <p className="text-sm tabular-nums">
            <span className="md:sr-only">Record: </span>
            {formatDate(demoReview.submittedAt)}
          </p>
          <div>
            <StatusIndicator status={demoPatient.status} />
          </div>
          <Button asChild variant="outline">
            <Link href={`/doctor/reviews/${demoReview.id}`}>
              Open review
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </article>
      </div>
      <Notice title="Reference workspace">
        The queue illustrates a future workflow. No analysis has been performed,
        no decision has been saved and no clinical validation has occurred in
        this environment.
      </Notice>
    </ContentContainer>
  );
}
