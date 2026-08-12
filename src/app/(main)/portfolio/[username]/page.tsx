import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PortfolioView,
  type PortfolioViewData,
} from "@/components/portfolio/portfolio-view";
import {
  PrintButton,
  ShareButton,
} from "@/components/portfolio/print-button";
import type { PortfolioSkill, PortfolioStats } from "@/lib/queries/student";

interface PageProps {
  params: Promise<{ username: string }>;
}

/**
 * Shape returned by the `public_portfolio(text)` SQL function. It resolves the
 * handle, enforces the student's visibility toggles and strips contact details
 * server-side, so this page never touches `profiles` directly — which is why
 * anonymous visitors can read a shared portfolio without `anon` having any
 * grant on that table.
 */
type PublicPortfolio =
  | { private: true; full_name: string }
  | {
      private: false;
      is_public: boolean;
      profile: {
        full_name: string;
        username: string | null;
        avatar_url: string | null;
        bio: string | null;
        university: string;
        links: Record<string, string> | null;
        email: string | null;
      };
      stats: PortfolioStats | null;
      skills: PortfolioSkill[];
      experience: PortfolioViewData["experience"];
      certifications: PortfolioViewData["certifications"];
    };

async function fetchPortfolio(username: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_portfolio", { handle: username });
  return (data ?? null) as unknown as PublicPortfolio | null;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const portfolio = await fetchPortfolio(username);

  if (!portfolio) return { title: "Portfolio not found" };

  if (portfolio.private) {
    return { title: "Private portfolio", robots: { index: false } };
  }

  return {
    title: `${portfolio.profile.full_name} — Portfolio`,
    description: `Verified campus technology experience for ${portfolio.profile.full_name} at ${portfolio.profile.university}, built automatically by ${APP_NAME}.`,
    openGraph: {
      title: `${portfolio.profile.full_name} — ${APP_NAME} portfolio`,
      description: `Verified campus activity at ${portfolio.profile.university}.`,
    },
  };
}

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { username } = await params;
  const portfolio = await fetchPortfolio(username);

  // Null means the handle does not exist at all.
  if (!portfolio) notFound();

  // Existing but unpublished: acknowledge the person without leaking evidence.
  if (portfolio.private) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
              <Lock className="size-5 text-navy-500" aria-hidden />
            </span>
            <h1 className="mt-4 text-lg font-semibold text-navy-900">
              This portfolio is private
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {portfolio.full_name} has not published their CampusOrbit
              portfolio. Portfolios are private until the student chooses to
              share them.
            </p>
            <Button asChild className="mt-6" variant="outline" size="sm">
              <Link href="/">Learn about CampusOrbit</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const links = (portfolio.profile.links ?? {}) as {
    github?: string;
    linkedin?: string;
    website?: string;
  };

  const data: PortfolioViewData = {
    fullName: portfolio.profile.full_name,
    username: portfolio.profile.username,
    avatarUrl: portfolio.profile.avatar_url,
    bio: portfolio.profile.bio,
    university: portfolio.profile.university,
    email: portfolio.profile.email,
    links,
    stats: portfolio.stats,
    skills: portfolio.skills ?? [],
    experience: portfolio.experience ?? [],
    certifications: portfolio.certifications ?? [],
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PortfolioView
        data={data}
        actions={
          <>
            <ShareButton url={absoluteUrl(`/portfolio/${username}`)} />
            <PrintButton />
          </>
        }
      />
    </div>
  );
}
