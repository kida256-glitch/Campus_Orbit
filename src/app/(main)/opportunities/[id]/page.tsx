import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";

import { getProfile } from "@/lib/auth";
import { getOpportunityDetail } from "@/lib/queries/catalog";
import { createClient } from "@/lib/supabase/server";
import { daysUntil } from "@/lib/utils";
import type { ProgressStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressButtons } from "@/components/opportunities/progress-buttons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const opportunity = await getOpportunityDetail(id);

  if (!opportunity) return { title: "Opportunity not found" };

  return {
    title: opportunity.title,
    description: opportunity.description.slice(0, 155),
  };
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [opportunity, profile] = await Promise.all([
    getOpportunityDetail(id),
    getProfile(),
  ]);

  if (!opportunity) notFound();

  let myStatus: ProgressStatus | null = null;

  if (profile?.role === "student") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("opportunity_progress")
      .select("status")
      .eq("opportunity_id", id)
      .eq("student_id", profile.id)
      .maybeSingle();

    myStatus = (data?.status as ProgressStatus | undefined) ?? null;
  }

  const days = opportunity.deadline ? daysUntil(opportunity.deadline) : null;
  const closed = days !== null && days < 0;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/opportunities">
          <ArrowLeft aria-hidden />
          All opportunities
        </Link>
      </Button>

      <article className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{opportunity.type}</Badge>
          {closed ? (
            <Badge variant="muted">Deadline passed</Badge>
          ) : days !== null && days <= 21 ? (
            <Badge variant="pending">
              <CalendarClock aria-hidden />
              {days === 0 ? "Closes today" : `${days} days left`}
            </Badge>
          ) : null}
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-3xl">
          {opportunity.title}
        </h1>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="size-4" aria-hidden />
          {opportunity.organization}
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-secondary/60 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Deadline
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-navy-900">
              {opportunity.deadline
                ? format(
                    new Date(`${opportunity.deadline}T00:00:00`),
                    "d MMMM yyyy",
                  )
                : "Rolling — no fixed deadline"}
            </dd>
          </div>
          <div className="rounded-xl bg-secondary/60 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Type
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-navy-900">
              {opportunity.type}
            </dd>
          </div>
        </dl>

        {opportunity.skill_tags.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-xs font-medium uppercase tracking-wide text-navy-500">
              Skills involved
            </h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {opportunity.skill_tags.map((tag) => (
                <li key={tag}>
                  <Badge variant="outline">{tag}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 max-w-3xl space-y-4">
          <h2 className="text-base font-semibold text-navy-900">Details</h2>
          {opportunity.description.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed text-navy-700">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          {profile?.role === "student" ? (
            <ProgressButtons
              opportunityId={opportunity.id}
              status={myStatus}
              showLabels
            />
          ) : !profile ? (
            <Button asChild>
              <Link href={`/login?next=/opportunities/${opportunity.id}`}>
                Sign in to track this
              </Link>
            </Button>
          ) : null}

          {opportunity.application_url ? (
            <Button asChild variant="outline">
              <a
                href={opportunity.application_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Apply externally
                <ExternalLink aria-hidden />
              </a>
            </Button>
          ) : null}
        </div>

        {profile?.role === "student" ? (
          <Card className="mt-6 border-emeraldx-100 bg-emeraldx-50/50">
            <CardContent className="flex gap-3 p-4">
              <Sparkles
                className="mt-0.5 size-5 shrink-0 text-emeraldx-600"
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  Marking this completed builds your portfolio
                </p>
                <p className="mt-1 text-xs leading-relaxed text-navy-600">
                  Completed opportunities appear as experience and contribute
                  their skills to your evidence profile. Applications happen on
                  the provider&apos;s own site — CampusOrbit records the outcome.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </article>
    </div>
  );
}
