import { describeAnalysisOutcome } from "@/server/analysis/outcome";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { WorkspaceReader } from "@/features/clinical-review/workspace";
import { DecisionForm } from "@/features/clinical-review/decision-form";
import { DecisionHistory } from "@/features/clinical-review/decision-history";
import { openReviewWorkspace } from "@/server/clinical-review/reader";

export const dynamic = "force-dynamic";

export default async function Review({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  const workspace = await openReviewWorkspace(reviewId);
  if (!workspace) notFound();
  return (
    <ContentContainer width="workspace">
      <PageHeader
        eyebrow="Clinical review · Synthetic scenario"
        title={workspace.patient.displayName}
        description={`Analysis v${workspace.analysis.version} · Patient-reported information, without clinical confirmation`}
        action={
          <Button variant="outline" asChild>
            <Link href="/doctor">Back to queue</Link>
          </Button>
        }
      />
      <WorkspaceReader
        workspace={workspace}
        outcome={describeAnalysisOutcome(
          workspace.analysis,
          workspace.profile,
          workspace.examinations,
          workspace.context,
        )}
      >
        <DecisionForm workspace={workspace} />
        <DecisionHistory workspace={workspace} />
      </WorkspaceReader>
    </ContentContainer>
  );
}
