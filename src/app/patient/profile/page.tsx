import { ContentContainer, PageHeader } from "@/components/layout/page";
import { ProfileView } from "@/features/health-intake/profile-view";
export default function Profile() {
  return (
    <ContentContainer width="form">
      <PageHeader
        eyebrow="Health history"
        title="Clinical profile"
        description="Review the declared and unknown information from your confirmed synthetic intake."
      />
      <ProfileView />
    </ContentContainer>
  );
}
