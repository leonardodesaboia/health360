import Link from "next/link";
import { ArrowRight, FileText, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import {
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import { demoPatient } from "@/features/patients/fixtures";
import {
  buildFallbackScenarioState,
  getActiveLocalFallback,
} from "@/server/clinical-review/service";
import { getDemoSession } from "@/server/demo/session";

export default async function PatientHome() {
  // Without a selected demo case, the reference fixture keeps the page illustrative.
  let sessionPatient = null;
  try {
    const session = await getDemoSession();
    if (session?.caseId === "daniel-pitch") {
      sessionPatient = (await buildFallbackScenarioState("daniel-pitch"))
        .patient;
    } else {
      sessionPatient = session?.patient ?? null;
    }
  } catch {
    sessionPatient = null;
  }
  const patient =
    sessionPatient ?? (await getActiveLocalFallback())?.patient ?? demoPatient;
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
            {patient.status === "PLAN_AVAILABLE"
              ? `In this example, ${patient.displayName}'s preventive plan has been reviewed and published by a demonstration physician.`
              : patient.status === "MEDICAL_REVIEW_PENDING" ||
                  patient.status === "MEDICAL_REVIEW_IN_PROGRESS"
                ? `In this example, ${patient.displayName}'s structured profile is ready and awaiting physician review before any plan is published.`
                : `In this example, ${patient.displayName}'s information is organized for a future review. No clinical analysis has been performed.`}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/patient/intake">
                View my history
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            {patient.status === "PLAN_AVAILABLE" && (
              <Button asChild variant="outline">
                <Link href="/patient/plan">
                  Open my reviewed plan
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="hidden size-20 items-center justify-center rounded-xl border border-brand-cyan/30 bg-secondary text-primary md:flex">
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
              "bg-brand-cyan text-foreground",
            ],
            [
              "02",
              "Physician review",
              "Preliminary proposals must be evaluated by a physician.",
              "bg-ring text-primary-foreground",
            ],
            [
              "03",
              "Your plan",
              "Next steps are only available after review.",
              "bg-primary text-primary-foreground",
            ],
          ].map(([number, title, description, circleTone], i) => {
            const stepCompleted =
              i === 0 ||
              (i === 1 &&
                (patient.status === "MEDICAL_REVIEW_PENDING" ||
                  patient.status === "MEDICAL_REVIEW_IN_PROGRESS" ||
                  patient.status === "MEDICAL_REVIEW_COMPLETED" ||
                  patient.status === "PLAN_AVAILABLE")) ||
              (i === 2 && patient.status === "PLAN_AVAILABLE");
            return (
              <li
                key={number}
                className="rounded-xl border border-brand-cyan/25 bg-secondary/50 p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex size-8 items-center justify-center rounded-full text-xs font-bold tabular-nums ${circleTone}`}
                  >
                    {number}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    {stepCompleted ? (
                      <Check
                        aria-hidden="true"
                        className="size-4 text-primary"
                      />
                    ) : (
                      <Circle aria-hidden="true" className="size-3" />
                    )}
                    STEP {number}
                  </span>
                </div>
                <h3 className="mt-4">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              </li>
            );
          })}
        </ol>
      </section>
      <Notice title="About this example">
        {patient.displayName} is fictional. The statuses and records illustrate
        the interface and do not represent a medical evaluation or approval.
      </Notice>
    </ContentContainer>
  );
}
