import { ShoppingBag, Store } from "lucide-react";

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
  description: "A lightweight student marketplace for laptops, phones, accessories and networking gear.",
};

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const [params, profile] = await Promise.all([searchParams, getProfile()]);

  const [listings, mine] = await Promise.all([
    listListings({ search: params.q, category: params.category }),
    profile ? loadMine(profile.id) : Promise.resolve(null),
  ]);

  const application = mine?.application ?? null;
  const myListings = mine?.myListings ?? [];

  // If the signed-in user is a student with no application yet, show the
  // seller application panel prominently at the top, centred, before listings.
  const showApplyProminent =
    profile?.role === "student" && !application;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace"
        title="Student marketplace"
        description="Buy and sell tech within the campus community. No payments, no escrow — connect and trade safely on campus."
      />

      {/* Safety notice */}
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4">
          <p className="text-xs leading-relaxed text-amber-900">
            <strong>Trade safely.</strong> CampusOrbit verifies sellers and moderates listings,
            but it does not process payments. Meet on campus, inspect the item, and pay only
            once you are satisfied.
          </p>
        </CardContent>
      </Card>

      {/* ── Prominent apply-to-sell prompt (students without an application) ── */}
      {showApplyProminent ? (
        <div className="mx-auto max-w-md">
          <div className="overflow-hidden rounded-3xl border border-orbit-100/80 bg-gradient-to-br from-orbit-600 via-orbit-700 to-navy-800 p-6 shadow-glow text-center sm:p-8">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
              <Store className="size-7 text-white" aria-hidden />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-white">Want to sell on campus?</h2>
            <p className="mt-2 text-sm text-white/75">
              Apply to become a verified seller. Once approved, you can list your items and
              reach students across campus.
            </p>
            {/* The SellerPanel handles the dialog itself */}
            <div className="mt-5 flex justify-center">
              <SellerPanel application={null} myListings={[]} prominent />
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Full seller panel for users with an existing application ── */}
      {profile && !showApplyProminent ? (
        <div className="mx-auto max-w-lg">
          <SellerPanel application={application} myListings={myListings} />
        </div>
      ) : null}

      {/* ── Listings grid ── */}
      <div className="space-y-4">
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
            hint="Every listing is reviewed before it appears here."
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground" role="status">
              {listings.length} {listings.length === 1 ? "listing" : "listings"}
            </p>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
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
