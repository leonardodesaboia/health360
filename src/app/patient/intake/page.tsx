import { ContentContainer, PageHeader } from "@/components/layout/page";
import { IntakeForm } from "@/features/health-intake/intake-form";
import { getDemoSession } from "@/server/demo/session";
import { getDatabase } from "@/server/db/client";
import { readIntakePrefill } from "@/server/intake/read";
export default async function Intake() {
  const session = await getDemoSession();
  const prefill = session
    ? await readIntakePrefill(
        getDatabase(),
        session.datasetId,
        session.patientId,
      )
    : null;
  return (
    <ContentContainer width="form">
      <PageHeader
        eyebrow="Health history"
        title="Guided health intake"
        description="Enter the synthetic scenario step by step. You can save a draft and return in this browser."
      />
      <IntakeForm
        key={session?.datasetId ?? "local"}
        scope={
          session
            ? `${session.datasetId}:${session.patientId}:v${prefill?.profileVersion}`
            : undefined
        }
        prefill={prefill?.answers}
      />
    </ContentContainer>
  );
}
