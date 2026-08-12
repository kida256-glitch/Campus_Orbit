import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { getPortfolioData } from "@/lib/queries/student";
import { listCertifications } from "@/lib/queries/catalog";
import { absoluteUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import {
  PortfolioView,
  type PortfolioViewData,
} from "@/components/portfolio/portfolio-view";
import { PrivacyPanel } from "@/components/portfolio/privacy-panel";
import { CertificationManager } from "@/components/portfolio/certification-manager";
import {
  PrintButton,
  ShareButton,
} from "@/components/portfolio/print-button";

export const metadata = { title: "My portfolio" };

export default async function MyPortfolioPage() {
  const profile = await requireRole("student");

  const [{ stats, skills, experience, certifications, visibility }, catalog] =
    await Promise.all([
      getPortfolioData(profile.id),
      listCertifications(undefined),
    ]);

  const links = (profile.links ?? {}) as {
    github?: string;
    linkedin?: string;
    website?: string;
  };

  const data: PortfolioViewData = {
    fullName: profile.full_name,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    university: profile.university,
    // The owner always sees their own contact row; the public view honours the
    // show_contact toggle instead.
    email: profile.email,
    links,
    stats,
    skills,
    experience,
    certifications: certifications
      .filter((cert) => cert.status === "completed")
      .map((cert) => ({
        name: cert.name,
        provider: cert.provider,
        skills: cert.skills,
        completion_date: cert.completion_date,
        credential_url: cert.credential_url,
      })),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Auto-built from your activity"
        title="My portfolio"
        description="You never fill this in. Participate on campus, get verified, and the evidence lands here."
        actions={
          visibility?.is_public && profile.username ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/portfolio/${profile.username}`}>
                View public page
                <ExternalLink aria-hidden />
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <PortfolioView
            data={data}
            actions={
              <>
                {visibility?.is_public && profile.username ? (
                  <ShareButton
                    url={absoluteUrl(`/portfolio/${profile.username}`)}
                  />
                ) : null}
                <PrintButton />
              </>
            }
          />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <PrivacyPanel
            username={profile.username}
            siteUrl={absoluteUrl()}
            initial={{
              isPublic: visibility?.is_public ?? false,
              showEvents: visibility?.show_events ?? true,
              showOpportunities: visibility?.show_opportunities ?? true,
              showCertifications: visibility?.show_certifications ?? true,
              showContact: visibility?.show_contact ?? false,
            }}
          />

          <CertificationManager
            certifications={certifications}
            catalog={catalog.map((cert) => ({
              id: cert.id,
              name: cert.name,
              provider: cert.provider,
            }))}
          />
        </aside>
      </div>
    </div>
  );
}
