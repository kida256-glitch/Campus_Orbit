import { requireProfile } from "@/lib/auth";
import { absoluteUrl } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Keep this current — interests and skills feed your recommendations and your portfolio."
        actions={
          <Badge variant="secondary">
            {ROLE_LABELS[profile.role as Role]}
          </Badge>
        }
      />

      <ProfileForm profile={profile} siteUrl={absoluteUrl()} />
    </div>
  );
}
