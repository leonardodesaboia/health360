import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { WorkspaceReader } from "@/features/clinical-review/workspace";
import { getReviewWorkspace } from "@/server/clinical-review/reader";

export const dynamic = "force-dynamic";

export default async function Review({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  const workspace = await getReviewWorkspace(reviewId);
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
      <WorkspaceReader workspace={workspace} />
    </ContentContainer>
  );
}
