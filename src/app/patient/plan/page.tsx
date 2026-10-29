import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, Notice } from "@/components/shared/primitives";
import {
  JourneyProgress,
  NextStepPanel,
} from "@/components/shared/workflow-guidance";
import { Button } from "@/components/ui/button";
import { PlanContent } from "@/features/preventive-plan/plan-content";
import { workflowPresentation } from "@/features/workflow/presentation";
import { loadPatientPlan } from "@/server/preventive-plan/load";

export default async function Plan() {
  const data = await loadPatientPlan();
  const model = data
    ? workflowPresentation(
        {
          status: data.status,
          planState: data.plan
            ? data.previous
              ? "previous"
              : "current"
            : "none",
          canContinueSavedAnalysis: false,
        },
        "plan",
      )
    : null;
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="My plan"
        title="Preventive follow-up"
        description="Plan information can only be made available after physician review."
      />
      {model ? (
        <>
          {data?.plan && !data.previous && <PlanContent plan={data.plan} />}
          <NextStepPanel model={model} id="plan-next-step" />
          <JourneyProgress model={model} id="plan-evaluation-progress" />
          {data?.plan && data.previous && (
            <>
              <Notice title="New evaluation in progress">
                New evaluation in progress. Plan version {data.plan.version}{" "}
                below is from an earlier review.
              </Notice>
              <PlanContent plan={data.plan} previous />
            </>
          )}
        </>
      ) : (
        <EmptyState
          title="Select a demonstration case"
          description="Choose Alex Example or Jordan Example in Presenter controls to begin this synthetic demonstration."
          action={
            <Button asChild>
              <Link href="/patient#demo-case-title">Choose a demo case</Link>
            </Button>
          }
        />
      )}
    </ContentContainer>
  );
}
