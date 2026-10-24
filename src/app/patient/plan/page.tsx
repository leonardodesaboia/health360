import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, StatusIndicator } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { PlanContent } from "@/features/preventive-plan/plan-content";
import { loadPatientPlan } from "@/server/preventive-plan/load";

export default async function Plan() {
  const data = await loadPatientPlan();
  const blocked = data?.status === "ANALYSIS_FAILED";
  const clarification = data?.status === "CLARIFICATION_REQUIRED";
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="My plan"
        title="Preventive follow-up"
        description="Plan information can only be made available after physician review."
      />
      {data && <StatusIndicator status={data.status} />}
      {data?.plan ? (
        <PlanContent plan={data.plan} previous={data.previous} />
      ) : (
        <EmptyState
          title={
            !data
              ? "Select a demonstration case"
              : blocked
                ? "Plan unavailable: analysis not completed"
                : clarification
                  ? "More information is needed"
                  : "Awaiting a reviewed plan"
          }
          description={
            !data
              ? "Choose a synthetic case from Home to view its follow-up."
              : blocked
                ? "The analysis must be retried and reviewed before a new plan can be published."
                : clarification
                  ? "Complete the requested information before analysis and physician review can continue."
                  : "Only a finalized, current physician review can make a plan available. Preliminary proposals are not shown here."
          }
          action={
            <Button asChild variant="outline">
              <Link href="/patient">Track evaluation</Link>
            </Button>
          }
        />
      )}
    </ContentContainer>
  );
}
