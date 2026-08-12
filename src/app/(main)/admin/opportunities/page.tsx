import { requireRole } from "@/lib/auth";
import { listAllOpportunities } from "@/lib/queries/admin";
import { PageHeader } from "@/components/shared/page-header";
import { OpportunityManager } from "@/components/admin/opportunity-manager";

export const metadata = { title: "Opportunity management" };

export default async function AdminOpportunitiesPage() {
  await requireRole("admin");
  const opportunities = await listAllOpportunities();

  const published = opportunities.filter(
    (item) => item.status === "published",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Curation"
        title="Opportunity management"
        description={`${published} of ${opportunities.length} live. Skill tags here feed the recommendation engine, so accuracy matters.`}
      />

      <OpportunityManager opportunities={opportunities} />
    </div>
  );
}
