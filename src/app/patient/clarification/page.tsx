import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Notice, Surface } from "@/components/shared/primitives";
import {
  JourneyProgress,
  NextStepPanel,
} from "@/components/shared/workflow-guidance";
import { Button } from "@/components/ui/button";
import { workflowPresentation } from "@/features/workflow/presentation";
import {
  ClarificationForm,
  ContinueAnalysisButton,
} from "@/features/clarification/clarification-form";
import { loadCurrentClarification } from "@/server/clarification/load";
import {
  continueSavedAnalysis,
  submitClarification,
} from "@/server/clarification/actions";

export default async function ClarificationPage() {
  const data = await loadCurrentClarification();
  const model =
    data.status === "READY" || data.status === "PENDING"
      ? workflowPresentation(
          {
            status:
              data.status === "READY"
                ? "CLARIFICATION_REQUIRED"
                : "ANALYSIS_PENDING",
            planState: "none",
            canContinueSavedAnalysis: data.status === "PENDING",
          },
          "clarification",
        )
      : null;
  return (
    <ContentContainer width="form">
      <PageHeader
        eyebrow="My evaluation"
        title="Information needed before review can continue"
        description="Answer the specific questions needed for another preliminary analysis of your synthetic case."
      />
      <Notice title="DEMONSTRATIVE — NOT CLINICALLY VALIDATED">
        Patient-reported answers are not verified clinical facts. A physician
        must review proposals before any new plan is available.
      </Notice>
      {data.status === "PENDING" && model ? (
        <NextStepPanel
          model={model}
          id="saved-analysis-next-step"
          taskAction={
            <form action={continueSavedAnalysis}>
              <ContinueAnalysisButton />
            </form>
          }
        />
      ) : data.status === "READY" ? (
        <Surface>
          <ClarificationForm
            key={`${data.form.analysisId}:${data.form.profileVersion}:${data.form.reviewId ?? "analysis"}:${data.form.reviewVersion ?? 0}`}
            {...data.form}
            submitAction={submitClarification}
          />
        </Surface>
      ) : (
        <Surface>
          <h2>
            {data.status === "NO_SESSION"
              ? "Select a demonstration case"
              : data.status === "UNSUPPORTED"
                ? "Supported questions are unavailable"
                : data.status === "UNAVAILABLE"
                  ? "Questions could not be loaded"
                  : "No clarification is currently requested"}
          </h2>
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {data.status === "NO_SESSION"
              ? "Choose Alex Example, Jordan Example or Daniel Example in Presenter controls to begin this synthetic demonstration."
              : data.status === "UNSUPPORTED"
                ? "This request needs a supported question set before you can answer it here. No information will be invented to complete the request."
                : data.status === "UNAVAILABLE"
                  ? "Your evaluation may have changed or storage may be unavailable. Check the analysis status and reload before trying again."
                  : "Check the analysis status for your current next step."}
          </p>
          <Button asChild className="mt-6">
            <Link
              href={
                data.status === "NO_SESSION"
                  ? "/patient#demo-case-title"
                  : "/patient/analysis"
              }
            >
              {data.status === "NO_SESSION"
                ? "Choose a demo case"
                : "View analysis status"}
            </Link>
          </Button>
        </Surface>
      )}
      {model && (
        <JourneyProgress model={model} id="clarification-evaluation-progress" />
      )}
      <Button asChild variant="ghost">
        <Link href="/patient">Back to home</Link>
      </Button>
    </ContentContainer>
  );
}
