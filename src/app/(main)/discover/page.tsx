import Link from "next/link";
import {
  Award,
  CalendarDays,
  Compass,
  ShoppingBag,
  Sparkles,
  Target,
} from "lucide-react";

import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getMyProgressMap,
  getMyRegistrationMap,
  listCertifications,
  listEvents,
  listListings,
  listOpportunities,
} from "@/lib/queries/catalog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { EventCard } from "@/components/shared/event-card";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { ListingCard } from "@/components/marketplace/listing-card";
import { RegistrationButtons } from "@/components/events/registration-buttons";
import { ProgressButtons } from "@/components/opportunities/progress-buttons";
import type { OpportunityCardData } from "@/components/shared/opportunity-card";

export const metadata = {
  title: "Discover",
  description:
    "One place to find campus events, opportunities, certifications and marketplace listings.",
};

const TABS = [
  { id: "all", label: "All", icon: Compass },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "opportunities", label: "Opportunities", icon: Target },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface PageProps {
  searchParams: Promise<{ q?: string; tab?: string }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const [params, profile] = await Promise.all([searchParams, getProfile()]);
  const search = params.q;
  const tab = (TABS.find((t) => t.id === params.tab)?.id ?? "all") as TabId;

  const isStudent = profile?.role === "student";

  const wants = (id: TabId) => tab === "all" || tab === id;

  // Discovery is the heaviest page — up to seven independent reads. They all go
  // out in one wave rather than three sequential batches, so the page costs one
  // round trip's latency instead of three.
  const wantsRecommendations = isStudent && tab === "all" && !search;

  const [
    events,
    opportunities,
    certifications,
    listings,
    registrations,
    progress,
    recommended,
  ] = await Promise.all([
    wants("events") ? listEvents({ search, when: "upcoming" }) : [],
    wants("opportunities") ? listOpportunities({ search }) : [],
    wants("certifications") ? listCertifications(search) : [],
    wants("marketplace") ? listListings({ search }) : [],
    isStudent
      ? getMyRegistrationMap(profile.id)
      : Promise.resolve(new Map<string, never>()),
    isStudent
      ? getMyProgressMap(profile.id)
      : Promise.resolve(new Map<string, never>()),
    wantsRecommendations
      ? createClient()
          .then((supabase) =>
            supabase.rpc("recommended_opportunities", {
              target: profile.id,
              max_rows: 3,
            }),
          )
          .then(
            ({ data }) =>
              (data ?? []) as (OpportunityCardData & { matched: string[] })[],
          )
      : Promise.resolve([] as (OpportunityCardData & { matched: string[] })[]),
  ]);

  const limit = tab === "all" ? 6 : 60;
  const totalResults =
    events.length + opportunities.length + certifications.length + listings.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Discover"
        title="Your campus technology hub"
        description="Events, opportunities, certifications and student listings in one searchable place."
      />

      {/* Tabs -------------------------------------------------------------- */}
      <nav aria-label="Discovery categories">
        <ul className="scrollbar-slim flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((item) => {
            const active = item.id === tab;
            const href =
              item.id === "all"
                ? search
                  ? `/discover?q=${encodeURIComponent(search)}`
                  : "/discover"
                : `/discover?tab=${item.id}${search ? `&q=${encodeURIComponent(search)}` : ""}`;

            return (
              <li key={item.id}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-transparent bg-navy-900 text-white"
                      : "border-border bg-card text-navy-700 hover:border-orbit-200 hover:text-orbit-700",
                  )}
                >
                  <item.icon className="size-3.5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <FilterBar placeholder="Search everything on CampusOrbit…" />

      {search ? (
        <p className="text-sm text-muted-foreground" role="status">
          {totalResults} {totalResults === 1 ? "result" : "results"} for &ldquo;
          {search}&rdquo;
        </p>
      ) : null}

      {/* Personalised strip ------------------------------------------------ */}
      {recommended.length > 0 ? (
        <section aria-labelledby="for-you-heading">
          <Card className="border-orbit-100 bg-orbit-50/50">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-orbit-600" aria-hidden />
                <h2
                  id="for-you-heading"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-orbit-700"
                >
                  Picked for you
                </h2>
              </div>
              <p className="mt-1.5 text-sm text-navy-700">
                Matched against the skills you have already evidenced.
              </p>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {recommended.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    matched={opportunity.matched}
                    progressStatus={progress.get(opportunity.id) ?? null}
                    className="bg-card"
                    actions={
                      <ProgressButtons
                        opportunityId={opportunity.id}
                        status={progress.get(opportunity.id) ?? null}
                      />
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {totalResults === 0 ? (
        <EmptyState
          icon={Compass}
          title={search ? "Nothing matched that search" : "Nothing here yet"}
          description={
            search
              ? "Try a broader term, or switch tabs to search a single category."
              : "Content appears here as communities submit events and moderators publish opportunities."
          }
        />
      ) : null}

      {/* Events ------------------------------------------------------------ */}
      {wants("events") && events.length > 0 ? (
        <Section
          title="Events"
          href={tab === "all" ? "/discover?tab=events" : undefined}
          count={events.length}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {events.slice(0, limit).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                registrationStatus={registrations.get(event.id) ?? null}
                footer={
                  isStudent ? (
                    <RegistrationButtons
                      eventId={event.id}
                      status={registrations.get(event.id) ?? null}
                      compact
                    />
                  ) : null
                }
              />
            ))}
          </div>
        </Section>
      ) : null}

      {/* Opportunities ----------------------------------------------------- */}
      {wants("opportunities") && opportunities.length > 0 ? (
        <Section
          title="Opportunities"
          href={tab === "all" ? "/discover?tab=opportunities" : undefined}
          count={opportunities.length}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {opportunities.slice(0, limit).map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                progressStatus={progress.get(opportunity.id) ?? null}
                actions={
                  isStudent ? (
                    <ProgressButtons
                      opportunityId={opportunity.id}
                      status={progress.get(opportunity.id) ?? null}
                    />
                  ) : null
                }
              />
            ))}
          </div>
        </Section>
      ) : null}

      {/* Certifications ---------------------------------------------------- */}
      {wants("certifications") && certifications.length > 0 ? (
        <Section
          title="Certifications"
          href={tab === "all" ? "/discover?tab=certifications" : undefined}
          count={certifications.length}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {certifications.slice(0, limit).map((cert) => (
              <Card key={cert.id} interactive className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Award className="size-[18px]" aria-hidden />
                  </span>
                  <Badge variant="secondary">{cert.provider}</Badge>
                </div>

                <h3 className="mt-3 text-[15px] font-semibold leading-snug text-navy-900">
                  {cert.name}
                </h3>

                {cert.description ? (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {cert.description}
                  </p>
                ) : null}

                {cert.skills.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {cert.skills.slice(0, 3).map((skill) => (
                      <li key={skill}>
                        <Badge variant="outline">{skill}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-4 flex items-center justify-between gap-2">
                  {isStudent ? (
                    <Link
                      href="/portfolio"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Track this
                    </Link>
                  ) : (
                    <span />
                  )}
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-navy-600 hover:text-orbit-700 hover:underline"
                    >
                      Official page
                    </a>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Marketplace ------------------------------------------------------- */}
      {wants("marketplace") && listings.length > 0 ? (
        <Section
          title="Marketplace"
          href={tab === "all" ? "/discover?tab=marketplace" : undefined}
          count={listings.length}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.slice(0, limit).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function Section({
  title,
  count,
  href,
  children,
}: {
  title: string;
  count: number;
  href?: string;
  children: React.ReactNode;
}) {
  const id = `${title.toLowerCase()}-heading`;

  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2
          id={id}
          className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
        >
          {title}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({count})
          </span>
        </h2>
        {href ? (
          <Link
            href={href}
            className="text-sm font-medium text-primary hover:underline"
          >
            See all
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
