import { Target } from "lucide-react";

import { getProfile } from "@/lib/auth";
import { getMyProgressMap, listOpportunities } from "@/lib/queries/catalog";
import { OPPORTUNITY_TYPES, SKILL_OPTIONS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressButtons } from "@/components/opportunities/progress-buttons";

export const metadata = {
  title: "Opportunities",
  description:
    "Internships, fellowships, hackathons, scholarships and certifications for students.",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    skill?: string;
    deadline?: string;
  }>;
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const [params, profile] = await Promise.all([searchParams, getProfile()]);

  const deadline =
    params.deadline === "soon" || params.deadline === "all"
      ? params.deadline
      : "open";

  const [opportunities, progress] = await Promise.all([
    listOpportunities({
      search: params.q,
      type: params.type,
      skill: params.skill,
      deadline,
    }),
    profile?.role === "student"
      ? getMyProgressMap(profile.id)
      : Promise.resolve(new Map<string, never>()),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Opportunities"
        title="Opportunities"
        description="Curated internships, fellowships, hackathons, scholarships and certifications. Completing one adds it to your portfolio."
      />

      <FilterBar
        placeholder="Search opportunities or organisations…"
        selects={[
          {
            name: "type",
            label: "Type",
            options: [
              { value: "all", label: "All types" },
              ...OPPORTUNITY_TYPES.map((type) => ({
                value: type,
                label: type,
              })),
            ],
          },
          {
            name: "skill",
            label: "Skill",
            options: [
              { value: "all", label: "All skills" },
              ...SKILL_OPTIONS.map((skill) => ({
                value: skill,
                label: skill,
              })),
            ],
          },
          {
            name: "deadline",
            label: "Deadline",
            options: [
              { value: "all", label: "Any deadline" },
              { value: "soon", label: "Closing in 3 weeks" },
            ],
          },
        ]}
      />

      {opportunities.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No opportunities match those filters"
          description="Try widening the type or skill filter, or clear everything to see the full directory."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground" role="status">
            {opportunities.length}{" "}
            {opportunities.length === 1 ? "opportunity" : "opportunities"}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                progressStatus={progress.get(opportunity.id) ?? null}
                actions={
                  profile?.role === "student" ? (
                    <ProgressButtons
                      opportunityId={opportunity.id}
                      status={progress.get(opportunity.id) ?? null}
                    />
                  ) : null
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
