import { ShoppingBag } from "lucide-react";

import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listListings } from "@/lib/queries/catalog";
import { MARKETPLACE_CATEGORIES } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/marketplace/listing-card";
import { SellerPanel } from "@/components/marketplace/seller-panel";

export const metadata = {
  title: "Marketplace",
  description:
    "A lightweight student marketplace for laptops, phones, accessories and networking gear.",
};

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const [params, profile] = await Promise.all([searchParams, getProfile()]);

  // Seller state is only relevant to the signed-in user's own row, and it is
  // independent of the public listing feed — fetch both at once.
  const [listings, mine] = await Promise.all([
    listListings({ search: params.q, category: params.category }),
    profile ? loadMine(profile.id) : Promise.resolve(null),
  ]);

  const application = mine?.application ?? null;
  const myListings = mine?.myListings ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace"
        title="Student marketplace"
        description="Buy and sell tech within the campus community. Deliberately lightweight — no payments, no escrow, no checkout."
      />

      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4">
          <p className="text-xs leading-relaxed text-amber-900">
            <strong>Trade safely.</strong> CampusOrbit verifies sellers and
            moderates listings, but it does not process payments or hold funds.
            Meet in a public place on campus, inspect the item, and pay only
            once you are satisfied.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <FilterBar
            placeholder="Search listings…"
            selects={[
              {
                name: "category",
                label: "Category",
                options: [
                  { value: "all", label: "All categories" },
                  ...MARKETPLACE_CATEGORIES.map((category) => ({
                    value: category,
                    label: category,
                  })),
                ],
              },
            ]}
          />

          {listings.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No listings match"
              description="Try another category, or clear the filters to see everything approved."
              hint="Every listing is reviewed by a moderator before it appears here."
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground" role="status">
                {listings.length}{" "}
                {listings.length === 1 ? "listing" : "listings"}
              </p>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )}
        </div>

        {profile ? (
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <SellerPanel application={application} myListings={myListings} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}

async function loadMine(userId: string) {
  const supabase = await createClient();

  const [applicationResult, listingsResult] = await Promise.all([
    supabase
      .from("seller_applications")
      .select("*")
      .eq("student_id", userId)
      .maybeSingle(),
    supabase
      .from("marketplace_listings")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    application: applicationResult.data,
    myListings: listingsResult.data ?? [],
  };
}
