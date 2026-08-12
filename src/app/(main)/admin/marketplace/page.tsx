import { Store } from "lucide-react";
import { format } from "date-fns";

import { requireRole } from "@/lib/auth";
import { getMarketplaceModeration } from "@/lib/queries/admin";
import { CONDITION_LABELS, type ListingCondition } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ModerationStatusBadge } from "@/components/shared/status-badge";
import { ModerationActions } from "@/components/admin/moderation-actions";

export const metadata = { title: "Marketplace approvals" };

export default async function AdminMarketplacePage() {
  await requireRole("admin");
  const { sellers, listings, pendingSellers, pendingListings } =
    await getMarketplaceModeration();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Moderation"
        title="Marketplace approvals"
        description="Verify sellers before they can list, and review listings before students see them. CampusOrbit never handles payments."
      />

      {/* Seller applications ---------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Seller applications{" "}
            {pendingSellers.length > 0 ? (
              <Badge variant="pending" className="ml-1.5">
                {pendingSellers.length} pending
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {sellers.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No applications yet"
              description="Students who want to sell will appear here for review."
            />
          ) : (
            <ul className="divide-y divide-border">
              {sellers.map((application) => (
                <li
                  key={application.id}
                  className="flex flex-col gap-3 py-4 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ModerationStatusBadge status={application.status} />
                      <Badge variant="outline">
                        {application.contact_method}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-navy-900">
                      {application.business_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {application.student?.full_name ?? "Unknown"} ·{" "}
                      {application.contact_value}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-navy-700">
                      {application.description}
                    </p>

                    {application.review_note ? (
                      <p className="mt-2 text-xs italic text-muted-foreground">
                        Note: {application.review_note}
                      </p>
                    ) : null}
                  </div>

                  {application.status === "pending" ? (
                    <div className="shrink-0">
                      <ModerationActions
                        id={application.id}
                        kind="seller"
                        title={application.business_name}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Listings ---------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Listings{" "}
            {pendingListings.length > 0 ? (
              <Badge variant="pending" className="ml-1.5">
                {pendingListings.length} pending
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {listings.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No listings yet"
              description="Approved sellers' listings will arrive here for review."
            />
          ) : (
            <ul className="divide-y divide-border">
              {listings.map((listing) => (
                <li
                  key={listing.id}
                  className="flex flex-col gap-3 py-4 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ModerationStatusBadge status={listing.status} />
                      <Badge variant="outline">{listing.category}</Badge>
                      <Badge variant="muted">
                        {CONDITION_LABELS[
                          listing.condition as ListingCondition
                        ] ?? listing.condition}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-navy-900">
                      {listing.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {listing.currency}{" "}
                      {new Intl.NumberFormat("en-UG").format(listing.price)} ·{" "}
                      {listing.seller?.full_name ?? "Unknown seller"} ·{" "}
                      {format(new Date(listing.created_at), "d MMM yyyy")}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-navy-700">
                      {listing.description}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <ModerationActions
                      id={listing.id}
                      kind="listing"
                      title={listing.product_name}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
