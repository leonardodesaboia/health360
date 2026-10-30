import { getAnalysisPageState } from "@/server/analysis/read";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, Notice } from "@/components/shared/primitives";
import {
  JourneyProgress,
  NextStepPanel,
} from "@/components/shared/workflow-guidance";
import { workflowPresentation } from "@/features/workflow/presentation";
import { getDemoSession } from "@/server/demo/session";

export default async function PatientHome() {
  const session = await getDemoSession();
  if (!session)
    return (
      <ContentContainer>
        <PageHeader
          eyebrow="My follow-up"
          title="Select a demo case"
          description="Choose Alex Example, Jordan Example or Daniel Example in Presenter controls to begin this synthetic demonstration."
        />
        <EmptyState
          title="No demo case selected"
          description="Alex, Jordan and Daniel are fictional patients. Choose a case in Presenter controls to begin."
        />
      </ContentContainer>
    );
  const patient = session.patient;
  const analysisState = await getAnalysisPageState();
  if (analysisState.unavailable)
    throw new Error("Evaluation could not be loaded");
  const model = workflowPresentation(
    {
      status: patient.status,
      outcome: analysisState.outcome,
      planState: "none",
      canContinueSavedAnalysis: false,
    },
    "home",
  );
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="My follow-up"
        title={`Hello, ${patient.displayName.split(" ")[0]}`}
        description="Your preventive follow-up, one step at a time."
      />
      <NextStepPanel model={model} id="home-next-step" />
      <JourneyProgress model={model} id="home-evaluation-progress" />
      <Notice title="About this example">
        {patient.displayName} is fictional. Statuses and records illustrate the
        workflow and are not a medical evaluation or approval.
      </Notice>
    </ContentContainer>
  );
}
