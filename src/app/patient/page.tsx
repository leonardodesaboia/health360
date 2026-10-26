import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import {
  EmptyState,
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import { patientNextStep } from "@/features/workflow/next-step";
import { getDemoSession } from "@/server/demo/session";

const journey = [
  [
    "Your health intake",
    "You share synthetic history; unknown answers stay unknown.",
  ],
  [
    "Physician review",
    "A physician reviews every preliminary proposal before you see it.",
  ],
  ["Your plan", "Reviewed next steps, kept as versions in your history."],
] as const;

export default async function PatientHome() {
  const session = await getDemoSession();
  if (!session)
    return (
      <ContentContainer>
        <PageHeader
          eyebrow="My follow-up"
          title="Select a demo case"
          description="Choose Alex Example or Jordan Example in the demo case bar above to load a fictional patient."
        />
        <EmptyState
          title="No demo case selected"
          description="Alex has no previous colorectal screening reported. Jordan reports an earlier normal colonoscopy. Both are synthetic and shared with the physician view."
        />
      </ContentContainer>
    );
  const patient = session.patient;
  const next = patientNextStep(patient.status);
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="My follow-up"
        title={`Hello, ${patient.displayName.split(" ")[0]}`}
        description="Your preventive follow-up, one step at a time."
      />
      <Surface>
        <StatusIndicator status={patient.status} />
        <h2 className="mt-4">{next.title}</h2>
        <p className="mt-2 max-w-form text-sm text-muted-foreground">
          {next.description}
        </p>
        <Button asChild className="mt-6">
          <Link href={next.href}>
            {next.action}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </Surface>
      <section aria-labelledby="journey-title">
        <h2 id="journey-title">How follow-up works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {journey.map(([title, description], index) => {
            const done = index < next.completedSteps;
            const current = index === next.completedSteps;
            return (
              <li
                key={title}
                aria-current={current ? "step" : undefined}
                className={
                  current ? "border-t-2 border-primary pt-4" : "border-t-2 pt-4"
                }
              >
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  {done ? (
                    <Check aria-hidden="true" className="size-4 text-primary" />
                  ) : (
                    <Circle aria-hidden="true" className="size-3" />
                  )}
                  Step {index + 1} ·{" "}
                  {done ? "Done" : current ? "Current" : "Upcoming"}
                </span>
                <h3 className="mt-3">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              </li>
            );
          })}
        </ol>
      </section>
      <Notice title="About this example">
        {patient.displayName} is fictional. Statuses and records illustrate the
        workflow and are not a medical evaluation or approval.
      </Notice>
    </ContentContainer>
  );
}
