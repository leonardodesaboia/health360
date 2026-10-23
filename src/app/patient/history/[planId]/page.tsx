import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { PlanContent } from "@/features/preventive-plan/plan-content";
import { loadHistoricalPlan } from "@/server/health-timeline/load";

export default async function HistoricalPlan({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const parsed = z
    .string()
    .min(1)
    .max(200)
    .safeParse((await params).planId);
  if (!parsed.success) notFound();
  const data = await loadHistoricalPlan(parsed.data);
  if (!data?.plan) notFound();
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="Plan history"
        title={`Plan version ${data.plan.version}`}
        description="Preserved content from a finalized demonstration physician review."
      />
      <Button asChild variant="outline">
        <Link href="/patient/history">Back to history</Link>
      </Button>
      <PlanContent plan={data.plan} previous={data.previous} />
    </ContentContainer>
  );
}
