import { ContentContainer, PageHeader } from "@/components/layout/page";
import { buildCompletedIntake } from "@/features/health-intake/profile";
import { ProfileView } from "@/features/health-intake/profile-view";
import {
  baselineAnswersForCase,
  getActiveLocalFallback,
} from "@/server/clinical-review/service";
import { getDemoSession } from "@/server/demo/session";

export default async function Profile() {
  let session = null;
  try {
    session = await getDemoSession();
  } catch {
    session = null;
  }
  const local = await getActiveLocalFallback();
  const activeCaseId = session?.caseId ?? local?.caseId ?? null;
  const fallbackProfile = activeCaseId
    ? buildCompletedIntake(
        `synthetic-${activeCaseId}`,
        baselineAnswersForCase(activeCaseId),
        local?.profile.version ?? session?.profile.version ?? 1,
        `demo-intake-${activeCaseId}`,
        local?.profile.updatedAt ??
          session?.profile.updatedAt ??
          "2026-10-25T12:00:00.000Z",
      )
    : null;

  return (
    <ContentContainer width="form">
      <PageHeader
        eyebrow="Health history"
        title="Clinical profile"
        description="Review the declared and unknown information from your confirmed synthetic intake."
      />
      <ProfileView fallbackProfile={fallbackProfile} />
    </ContentContainer>
  );
}
