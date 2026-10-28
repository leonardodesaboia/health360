import {
  JourneyProgress,
  NextStepPanel,
} from "@/components/shared/workflow-guidance";
import { workflowPresentation } from "@/features/workflow/presentation";
import { DoctorShell } from "@/components/layout/shell";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FormExample } from "@/components/shared/form-example";
import {
  EvidenceDetails,
  InformationGap,
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import { workflowStatuses } from "@/features/workflow/workflow";
export default function Showcase() {
  return (
    <DoctorShell>
      <ContentContainer>
        <PageHeader
          eyebrow="Design system"
          title="Component library"
          description="Shared patterns for a consistent, accessible clinical interface."
        />
        <Surface>
          <h2>Actions and controls</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Disabled visual variants; the form below demonstrates a working
            action.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled>Primary</Button>
            <Button disabled variant="outline">
              Secondary
            </Button>
            <Button disabled variant="ghost">
              Subtle
            </Button>
            <Button disabled variant="destructive">
              Destructive
            </Button>
          </div>
        </Surface>
        <Surface>
          <h2>Fields and validation</h2>
          <div className="mt-6">
            <FormExample />
          </div>
        </Surface>
        <NextStepPanel
          id="showcase-next-step"
          model={workflowPresentation(
            {
              status: "MEDICAL_REVIEW_PENDING",
              planState: "none",
              canContinueSavedAnalysis: false,
            },
            "analysis",
          )}
        />
        <JourneyProgress
          id="showcase-progress"
          model={workflowPresentation(
            {
              status: "MEDICAL_REVIEW_PENDING",
              planState: "none",
              canContinueSavedAnalysis: false,
            },
            "analysis",
          )}
        />
        <Surface>
          <h2>Administrative states</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {workflowStatuses.map((status) => (
              <StatusIndicator key={status} status={status} />
            ))}
          </div>
        </Surface>
        <div className="space-y-4">
          <Notice title="Information">
            Messages use text and icons without relying on color alone.
          </Notice>
          <InformationGap items={["Unknown information in this scenario"]} />
          <EvidenceDetails />
        </div>
      </ContentContainer>
    </DoctorShell>
  );
}
