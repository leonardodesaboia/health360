import { ContentContainer, PageHeader } from "@/components/layout/page";
import { IntakeForm } from "@/features/health-intake/intake-form";
export default function Intake() {
  return (
    <ContentContainer width="form">
      <PageHeader
        eyebrow="Health history"
        title="Guided health intake"
        description="Enter the synthetic scenario step by step. You can save a draft and return in this browser."
      />
      <IntakeForm />
    </ContentContainer>
  );
}
