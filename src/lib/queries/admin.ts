import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EventStatus, ModerationStatus } from "@/lib/constants";
import type { Tables } from "@/lib/types/database";

export interface PlatformAnalytics {
  students: number;
  community_leaders: number;
  admins: number;
  suspended: number;
  events_total: number;
  events_pending: number;
  events_approved: number;
  events_rejected: number;
  events_completed: number;
  registrations: number;
  verified_attendance: number;
  opportunities: number;
  opportunities_completed: number;
  certifications_completed: number;
  listings: number;
  listings_pending: number;
  sellers_pending: number;
  public_portfolios: number;
  events_by_category: { category: string; count: number }[];
  registrations_by_status: { status: string; count: number }[];
  signups_by_week: { week: string; count: number }[];
}

/** One round trip for the whole analytics dashboard. Admin-only, enforced in SQL. */
export async function getPlatformAnalytics() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("platform_analytics");
  return (data ?? null) as unknown as PlatformAnalytics | null;
}

export interface AdminEventRow extends Tables<"events"> {
  author: { full_name: string; username: string | null } | null;
  registrations: { count: number }[];
}

/** The moderation queue. Defaults to pending, which is the working view. */
export async function listEventsForModeration(status: EventStatus | "all") {
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select(
      "*, author:profiles!events_created_by_fkey(full_name, username), registrations:event_registrations(count)",
    );

  if (status !== "all") query = query.eq("status", status);

  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as AdminEventRow[];
}

export async function listAllOpportunities() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as Tables<"opportunities">[];
}

export interface SellerApplicationRow extends Tables<"seller_applications"> {
  student: { full_name: string; username: string | null; email: string } | null;
}

export interface AdminListingRow extends Tables<"marketplace_listings"> {
  seller: { full_name: string; username: string | null } | null;
}

export async function getMarketplaceModeration() {
  const supabase = await createClient();

  const [sellersResult, listingsResult] = await Promise.all([
    supabase
      .from("seller_applications")
      .select(
        "*, student:profiles!seller_applications_student_id_fkey(full_name, username, email)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("marketplace_listings")
      .select(
        "*, seller:profiles!marketplace_listings_seller_id_fkey(full_name, username)",
      )
      .order("created_at", { ascending: false }),
  ]);

  const sellers = (sellersResult.data ?? []) as SellerApplicationRow[];
  const listings = (listingsResult.data ?? []) as AdminListingRow[];

  const pending = (status: ModerationStatus) => (row: { status: string }) =>
    row.status === status;

  return {
    sellers,
    listings,
    pendingSellers: sellers.filter(pending("pending")),
    pendingListings: listings.filter(pending("pending")),
  };
}

export interface AdminUserRow extends Tables<"profiles"> {
  verified: { count: number }[];
}

/**
 * User directory with each student's verified-activity count, so an admin can
 * see engagement without opening every profile.
 */
export async function listUsers(search?: string) {
  const supabase = await createClient();

  // `profiles` has two foreign keys into event_registrations (student_id and
  // verified_by), so the relationship must be named explicitly.
  let query = supabase
    .from("profiles")
    .select(
      "*, verified:event_registrations!event_registrations_student_id_fkey(count)",
    );

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `full_name.ilike.${term},email.ilike.${term},username.ilike.${term}`,
    );
  }

  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as AdminUserRow[];
}
