import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Notice, Surface } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
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
  return (
    <ContentContainer width="form">
      <PageHeader
        eyebrow="My evaluation"
        title="Confirm missing information"
        description="Answer the specific questions needed for another preliminary analysis of your synthetic case."
      />
      <Notice title="DEMONSTRATIVE — NOT CLINICALLY VALIDATED">
        Patient-reported answers are not verified clinical facts. A physician
        must review proposals before any new plan is available.
      </Notice>
      <Surface>
        {data.status === "READY" ? (
          <ClarificationForm
            key={`${data.form.analysisId}:${data.form.profileVersion}:${data.form.reviewId ?? "analysis"}:${data.form.reviewVersion ?? 0}`}
            {...data.form}
            submitAction={submitClarification}
          />
        ) : (
          <>
            <h2>
              {data.status === "NO_SESSION"
                ? "Select a demo case"
                : data.status === "PENDING"
                  ? "Your information is saved"
                  : data.status === "UNSUPPORTED"
                    ? "Supported questions are unavailable"
                    : data.status === "UNAVAILABLE"
                      ? "Questions could not be loaded"
                      : "No clarification is currently requested"}
            </h2>
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              {data.status === "NO_SESSION"
                ? "Choose a synthetic demonstration case before answering questions."
                : data.status === "PENDING"
                  ? "Continue the analysis of your saved information. Your previous profile and any reviewed plan remain preserved."
                  : data.status === "UNSUPPORTED"
                    ? "This request needs a supported question set before you can answer it here. No information will be invented to complete the request."
                    : data.status === "UNAVAILABLE"
                      ? "Your evaluation may have changed or storage may be unavailable. Check the analysis status and reload before trying again."
                      : "Check the analysis status for your current next step."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {data.status === "PENDING" && (
                <form action={continueSavedAnalysis}>
                  <ContinueAnalysisButton />
                </form>
              )}
              <Button asChild variant="outline">
                <Link href="/patient/analysis">View analysis status</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/patient">Back to home</Link>
              </Button>
            </div>
          </>
        )}
      </Surface>
    </ContentContainer>
  );
}
