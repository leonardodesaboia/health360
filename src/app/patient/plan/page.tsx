import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import {
  EmptyState,
  Notice,
  StatusIndicator,
} from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { demoPatient } from "@/features/patients/fixtures";
export default function Plan() {
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="My plan"
        title="Preventive follow-up"
        description="Plan information can only be made available after physician review."
      />
      <StatusIndicator status={demoPatient.status} />
      <EmptyState
        title="No plan available in this example"
        description="Plan generation and decision recording are not yet part of this stage of the prototype."
        action={
          <Button asChild variant="outline">
            <Link href="/patient">Track evaluation</Link>
          </Button>
        }
      />
      <Notice title="Version history">
        When follow-up cycles are implemented, previous plans will be preserved
        here.
      </Notice>
    </ContentContainer>
  );
}
