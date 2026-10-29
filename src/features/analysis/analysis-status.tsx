import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, Notice } from "@/components/shared/primitives";
import {
  JourneyProgress,
  NextStepPanel,
} from "@/components/shared/workflow-guidance";
import { Button } from "@/components/ui/button";
import { workflowPresentation } from "@/features/workflow/presentation";
import type { WorkflowStatus } from "@/features/workflow/workflow";
import { AnalyzeButton } from "./analyze-button";

export function AnalysisStatus({
  status,
  analyzeAction,
  error,
}: {
  status: WorkflowStatus | null;
  analyzeAction: () => Promise<void>;
  error?: boolean;
}) {
  const model = status
    ? workflowPresentation(
        { status, planState: "none", canContinueSavedAnalysis: false },
        "analysis",
      )
    : null;
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="My evaluation"
        title="Analysis status"
        description="Follow the analysis of your synthetic demonstration information."
      />
      <Notice title="DEMONSTRATIVE — NOT CLINICALLY VALIDATED">
        Analysis is preliminary. A physician must review proposals before a plan
        becomes available.
      </Notice>
      {error && !model && (
        <Notice title="We could not confirm the analysis result" tone="warning">
          Check the latest recorded status before trying again. No completion is
          assumed.
        </Notice>
      )}
      {!model ? (
        <EmptyState
          title="Select a demonstration case"
          description="Choose Alex Example or Jordan Example in Presenter controls to begin this synthetic demonstration."
          action={
            <Button asChild>
              <Link href="/patient#demo-case-title">Choose a demo case</Link>
            </Button>
          }
        />
      ) : (
        <>
          {model.primary.kind === "task" ? (
            <form action={analyzeAction}>
              <AnalyzeButton model={model} error={error} />
            </form>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{model.label}</p>
              {error && (
                <Notice
                  title="We could not confirm the analysis result"
                  tone="warning"
                >
                  Check the latest recorded status before trying again. No
                  completion is assumed.
                </Notice>
              )}
              <NextStepPanel model={model} id="analysis-next-step" />
            </>
          )}
          <JourneyProgress model={model} id="analysis-evaluation-progress" />
          {status === "ANALYSIS_PENDING" && (
            <Button asChild variant="outline">
              <Link href="/patient/clarification">
                Check saved-analysis recovery
              </Link>
            </Button>
          )}
        </>
      )}
      <Button asChild variant="ghost">
        <Link href="/patient">Back to home</Link>
      </Button>
    </ContentContainer>
  );
}
