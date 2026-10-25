import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import {
  EvidenceDetails,
  InformationGap,
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import { ReviewWorkspace } from "@/features/clinical-review/review-workspace";
import {
  demoExamination,
  demoPatient,
  demoProfile,
  demoReview,
} from "@/features/patients/fixtures";
import { loadDoctorReview } from "@/server/clinical-review/service";
import { getDemoSession } from "@/server/demo/session";

export default async function Review({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  let session = null;
  try {
    session = await getDemoSession();
  } catch {
    session = null;
  }
  const state = await loadDoctorReview(session, reviewId);
  if (!state) notFound();

  if (state.mode === "session") {
    return (
      <ContentContainer width="workspace">
        <PageHeader
          eyebrow={`Clinical review · Synthetic scenario (${state.caseId})`}
          title={state.patient.displayName}
          description={`Age ${state.profile.age ?? "unknown"} · Profile v${state.profile.version} · Analysis v${state.analysis.version} · Patient-reported information, awaiting physician verification`}
          action={
            <Button variant="outline" asChild>
              <Link href="/doctor">Back to queue</Link>
            </Button>
          }
        />
        <ReviewWorkspace
          caseId={state.caseId}
          patient={state.patient}
          status={state.status}
          profile={state.profile}
          examinations={state.examinations}
          clinicalContext={state.clinicalContext}
          analysis={state.analysis}
          existingReview={state.existingReview}
          publishedPlan={state.publishedPlan}
          isCurrentAnalysis={state.isCurrentAnalysis}
        />
      </ContentContainer>
    );
  }

  if (reviewId !== demoReview.id) notFound();

  return (
    <ContentContainer width="workspace">
      <PageHeader
        eyebrow="Clinical review · Synthetic scenario"
        title={demoPatient.displayName}
        description="Age 46 · Profile v1 · Patient-reported information, without clinical confirmation"
        action={
          <Button variant="outline" asChild>
            <Link href="/doctor">Back to queue</Link>
          </Button>
        }
      />
      <Notice
        tone="warning"
        title="Demonstration structure, without clinical analysis"
      >
        No proposal or medical evidence has been generated. Decision controls
        are unavailable at this stage.
      </Notice>
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Surface>
            <h2>Patient context</h2>
            <dl className="mt-6 divide-y text-sm">
              <div className="pb-4">
                <dt className="text-muted-foreground">
                  Personal history · Patient-reported
                </dt>
                <dd className="mt-1">Not provided</dd>
              </div>
              <div className="py-4">
                <dt className="text-muted-foreground">
                  Habits · Patient-reported
                </dt>
                <dd className="mt-1">{demoProfile.habits[0].value}</dd>
              </div>
              <div className="py-4">
                <dt className="text-muted-foreground">Medications</dt>
                <dd className="mt-1">Unknown</dd>
              </div>
              <div className="pt-4">
                <dt className="text-muted-foreground">
                  Previous examinations · Patient-reported
                </dt>
                <dd className="mt-1">{demoExamination.name}</dd>
                <dd className="mt-1 text-muted-foreground">
                  {demoExamination.notes}
                </dd>
              </div>
            </dl>
          </Surface>
          <InformationGap items={demoProfile.missingInformation} />
        </div>
        <div className="space-y-6">
          <Surface>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2>Proposals for review</h2>
              <StatusIndicator status={demoPatient.status} />
            </div>
            <p className="my-6 text-sm text-muted-foreground">
              This area will contain preliminary proposals with traceable
              criteria, rationales and uncertainties. No clinical content is
              available.
            </p>
            <EvidenceDetails />
          </Surface>
          <Surface>
            <h2>Physician decision</h2>
            <p
              id="decision-note"
              className="mt-3 text-sm text-muted-foreground"
            >
              Decision recording will include a rationale, reviewer
              identification and analysis version. Publication will require a
              completed review.
            </p>
            <div
              className="mt-6 flex flex-wrap gap-3"
              aria-describedby="decision-note"
            >
              <Button disabled>Approve</Button>
              <Button disabled variant="outline">
                Modify
              </Button>
              <Button disabled variant="outline">
                Reject
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Unavailable in the interface prototype.
            </p>
          </Surface>
        </div>
      </div>
    </ContentContainer>
  );
}
