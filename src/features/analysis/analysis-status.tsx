import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import {
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import type { WorkflowStatus } from "@/features/workflow/workflow";
import { AnalyzeButton } from "./analyze-button";
import { ClarificationCard } from "./clarification-card";

export function AnalysisStatus({
  status,
  analyzeAction,
  error,
}: {
  status: WorkflowStatus | null;
  analyzeAction: () => Promise<void>;
  error?: boolean;
}) {
  const canAnalyze =
    status === "INTAKE_COMPLETED" ||
    status === "ANALYSIS_FAILED" ||
    status === "REASSESSMENT_PENDING";
  const isReview =
    status === "MEDICAL_REVIEW_PENDING" ||
    status === "MEDICAL_REVIEW_IN_PROGRESS";
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
      <Surface>
        <h2 className="mb-4">Your next step</h2>
        {status && <StatusIndicator status={status} />}
        <div
          role="status"
          className="mt-4 space-y-3 text-sm text-muted-foreground"
        >
          {error ? (
            <p>
              The analysis could not be completed. Refresh this page and try
              again.
            </p>
          ) : null}
          {!status && !error ? (
            <p>Select a synthetic demonstration case to begin.</p>
          ) : null}
          {canAnalyze ? (
            <p>
              {status === "ANALYSIS_FAILED"
                ? "The analysis could not be completed. No new proposals are available. You can retry with the current information."
                : "Your current information is ready for a preliminary analysis."}
            </p>
          ) : null}
          {status === "ANALYSIS_PENDING" ? (
            <p>
              The analysis is in preparation. Refresh this page to check its
              status.
            </p>
          ) : null}
          {status === "CLARIFICATION_REQUIRED" ? (
            <p>
              More information is needed before the analysis can continue.
              Unknown answers remain unknown.
            </p>
          ) : null}
          {isReview ? (
            <p>
              The preliminary analysis is awaiting physician review. Your
              reviewed plan will be available after the review is finalized.
            </p>
          ) : null}
          {status === "NOT_STARTED" || status === "INTAKE_IN_PROGRESS" ? (
            <p>Complete your health history before requesting analysis.</p>
          ) : null}
          {status === "MEDICAL_REVIEW_COMPLETED" ||
          status === "PLAN_AVAILABLE" ? (
            <p>View your plan status for the next step in your evaluation.</p>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {canAnalyze ? (
            <form action={analyzeAction}>
              <AnalyzeButton retry={status === "ANALYSIS_FAILED"} />
            </form>
          ) : null}
          {status === "ANALYSIS_PENDING" ? (
            <Button asChild variant="outline">
              <Link href="/patient/analysis">Refresh status</Link>
            </Button>
          ) : null}
          {isReview ||
          status === "MEDICAL_REVIEW_COMPLETED" ||
          status === "PLAN_AVAILABLE" ? (
            <Button asChild variant="outline">
              <Link href="/patient/plan">View plan status</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/patient/intake">View my history</Link>
            </Button>
          )}
          {isReview ? (
            <Button asChild>
              <Link href="/doctor">Open physician review queue</Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost">
            <Link href="/patient">Back to home</Link>
          </Button>
        </div>
      </Surface>

      {status === "CLARIFICATION_REQUIRED" ? <ClarificationCard /> : null}
    </ContentContainer>
  );
}
