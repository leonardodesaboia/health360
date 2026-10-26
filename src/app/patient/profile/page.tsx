import { ContentContainer, PageHeader } from "@/components/layout/page";
import { ProfileView } from "@/features/health-intake/profile-view";
import { getDemoSession } from "@/server/demo/session";
import { getDatabase } from "@/server/db/client";
import { readIntakePrefill, readLatestProfile } from "@/server/intake/read";

export default async function Profile() {
  const session = await getDemoSession();
  let stored;
  if (session) {
    const db = getDatabase();
    const [latest, prefill] = await Promise.all([
      readLatestProfile(db, session.datasetId, session.patientId),
      readIntakePrefill(db, session.datasetId, session.patientId),
    ]);
    stored = latest ? { ...latest, answers: prefill.answers } : null;
  }
  return (
    <ContentContainer width="form">
      <PageHeader
        eyebrow="Health history"
        title="Clinical profile"
        description="Review the declared and unknown information from your confirmed synthetic intake."
      />
      <ProfileView stored={stored} />
    </ContentContainer>
  );
}
