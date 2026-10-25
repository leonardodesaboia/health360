import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, ShieldCheck } from "lucide-react";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Notice, StatusIndicator, Surface } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { PrepareAnalysisButton } from "@/features/clinical-review/prepare-analysis-button";
import { demoPatient, demoReview } from "@/features/patients/fixtures";
import { formatDate } from "@/lib/format";
import { loadDoctorQueue } from "@/server/clinical-review/service";
import { getDemoSession } from "@/server/demo/session";

export default async function Queue() {
  let session = null;
  try {
    session = await getDemoSession();
  } catch {
    session = null;
  }
  const state = await loadDoctorQueue(session);

  return (
    <ContentContainer width="workspace">
      <PageHeader
        eyebrow="Physician workspace"
        title="Review queue"
        description="Organized context to support review. All records below are fictional."
      />

      {state.mode === "session" ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="hidden grid-cols-[2fr_1fr_2fr_auto] gap-4 border-b bg-muted px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
            <span>Patient & synthetic scenario</span>
            <span>Record date</span>
            <span>Administrative stage</span>
            <span>Action</span>
          </div>
          <article className="grid items-center gap-4 p-6 md:grid-cols-[2fr_1fr_2fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base">{state.patient.displayName}</h2>
                {state.latestAnalysis?.proposals.some(
                  (p) => p.category === "POSSIBLE_REDUNDANCY",
                ) && (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-success px-2 py-0.5 text-xs font-semibold text-success-foreground">
                    <ShieldCheck aria-hidden="true" className="size-3.5" />
                    Do Not Test · Redundancy
                  </span>
                )}
                {state.latestAnalysis?.proposals.some(
                  (p) => p.category === "PREVENTIVE_OPPORTUNITY",
                ) && (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                    <ClipboardCheck aria-hidden="true" className="size-3.5" />
                    Preventive Opportunity
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                Scenario: {state.caseId} · Age{" "}
                {state.profile.age ?? "unknown"} · Profile v
                {state.profile.version}
                {state.latestAnalysis
                  ? ` · Analysis v${state.latestAnalysis.version}`
                  : ""}
              </p>
            </div>
            <p className="text-sm tabular-nums">
              <span className="md:sr-only">Record: </span>
              {formatDate(
                (
                  state.latestAnalysis?.createdAt ?? state.profile.updatedAt
                ).slice(0, 10),
              )}
            </p>
            <div>
              <StatusIndicator status={state.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {state.latestAnalysis &&
              state.latestAnalysis.status === "PRELIMINARY" &&
              state.latestAnalysis.profileVersion === state.profile.version ? (
                <Button asChild variant="outline">
                  <Link
                    href={`/doctor/reviews/${encodeURIComponent(state.latestAnalysis.id)}`}
                  >
                    Open review
                    <ArrowUpRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <PrepareAnalysisButton
                  caseId={state.caseId}
                  label="Prepare scenario analysis"
                />
              )}
            </div>
          </article>
        </div>
      ) : (
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
      )}

      <Surface className="space-y-4">
        <div>
          <h2>Interactive scenario reviews (Physician-in-the-loop)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Launch either prepared synthetic case directly into the clinical
            review workspace to evaluate proposals and publish a patient plan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col justify-between gap-4 rounded-lg border bg-background p-5">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Flow B · Do Not Test Intelligence
              </span>
              <h3 className="text-base font-semibold">
                Jordan Example (Age 60 · repeat-screening)
              </h3>
              <p className="text-xs text-muted-foreground">
                Normal, complete colonoscopy reported in Nov 2022 (4 years ago).
                Evaluates possible repeat redundancy within the 10-year
                guideline interval.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <PrepareAnalysisButton
                caseId="repeat-screening"
                label="Prepare & open Jordan review"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-lg border bg-background p-5">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                <ClipboardCheck aria-hidden="true" className="size-3.5" />
                Flow A · First Preventive Evaluation
              </span>
              <h3 className="text-base font-semibold">
                Alex Example (Age 50 · first-screening)
              </h3>
              <p className="text-xs text-muted-foreground">
                Asymptomatic average-risk patient with no previous colorectal
                screening reported. Evaluates preventive screening opportunity
                per USPSTF 2021.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <PrepareAnalysisButton
                caseId="first-screening"
                variant="outline"
                label="Prepare & open Alex review"
              />
            </div>
          </div>
        </div>
      </Surface>

      <Notice title="Reference workspace">
        All patient records and clinical proposals are synthetic and
        demonstrative. Physician review and explicit finalization are mandatory
        before a plan becomes available in the patient view.
      </Notice>
    </ContentContainer>
  );
}
