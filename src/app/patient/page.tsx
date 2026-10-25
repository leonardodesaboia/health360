import Link from "next/link";
import { ArrowRight, FileText, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import {
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import { getDemoSession } from "@/server/demo/session";

export default async function PatientHome() {
  const session = await getDemoSession();
  if (!session)
    return (
      <ContentContainer>
        <PageHeader
          eyebrow="My follow-up"
          title="Select a demo case"
          description="Choose a synthetic case using the demo controls to begin your evaluation."
        />
      </ContentContainer>
    );
  const patient = session.patient;
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="My follow-up"
        title={`Hello, ${patient.displayName.split(" ")[0]}`}
        description="Track the stages of your preventive evaluation here."
      />
      <Surface className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <StatusIndicator status={patient.status} />
          <h2 className="mt-5">Your history is the starting point</h2>
          <p className="mt-2 max-w-form text-sm text-muted-foreground">
            In this example, {patient.displayName}&apos;s information is
            organized for a future review. No clinical analysis has been
            performed.
          </p>
          <Button asChild className="mt-6">
            <Link href="/patient/intake">
              View my history
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="hidden size-20 items-center justify-center rounded-xl bg-secondary text-primary md:flex">
          <FileText aria-hidden="true" className="size-8" />
        </div>
      </Surface>
      <section aria-labelledby="journey-title">
        <h2 id="journey-title">How follow-up works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            [
              "01",
              "Your history",
              "Information you share to provide context for the evaluation.",
            ],
            [
              "02",
              "Physician review",
              "Preliminary proposals must be evaluated by a physician.",
            ],
            ["03", "Your plan", "Next steps are only available after review."],
          ].map(([number, title, description], i) => (
            <li key={number} className="border-t-2 pt-4">
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {i === 0 ? (
                  <Check aria-hidden="true" className="size-4 text-primary" />
                ) : (
                  <Circle aria-hidden="true" className="size-3" />
                )}
                STEP {number}
              </span>
              <h3 className="mt-3">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <Notice title="About this example">
        {patient.displayName} is fictional. The statuses and records illustrate
        the interface and do not represent a medical evaluation or approval.
      </Notice>
    </ContentContainer>
  );
}
