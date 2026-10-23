import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import {
  InformationGap,
  Notice,
  Surface,
} from "@/components/shared/primitives";
import { demoPatient, demoProfile } from "@/features/patients/fixtures";
import { formatNumber } from "@/lib/format";
export default function Intake() {
  return (
    <ContentContainer width="form">
      <PageHeader
        eyebrow="Health history"
        title="Example information"
        description="Reference view of health history. Data entry and saving will be implemented in a later stage."
      />
      <Notice title="Read-only">
        Do not enter real personal data. This page displays synthetic
        information only.
      </Notice>
      <Surface>
        <h2>Demonstration profile</h2>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Fictional name</dt>
            <dd className="mt-1 font-medium">{demoPatient.displayName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Age in scenario</dt>
            <dd className="mt-1">
              {demoProfile.age === null
                ? "Unknown"
                : `${formatNumber(demoProfile.age)} years`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              Habits · Patient-reported information
            </dt>
            <dd className="mt-1">{demoProfile.habits[0].value}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Medications</dt>
            <dd className="mt-1">Not provided</dd>
          </div>
        </dl>
      </Surface>
      <InformationGap items={demoProfile.missingInformation} />
      <Button variant="outline" asChild>
        <Link href="/patient">Back to home</Link>
      </Button>
    </ContentContainer>
  );
}
