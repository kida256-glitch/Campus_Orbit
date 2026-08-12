import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  CACHE_TAGS,
  cachedCatalog,
  createPublicClient,
} from "@/lib/supabase/public";
import type { EventCardData } from "@/components/shared/event-card";
import type { OpportunityCardData } from "@/components/shared/opportunity-card";
import type {
  ProgressStatus,
  RegistrationStatus,
} from "@/lib/constants";
import type { Tables } from "@/lib/types/database";

const EVENT_COLUMNS =
  "id, title, date, start_time, end_time, location, category, banner_image, organizer";

const OPPORTUNITY_COLUMNS =
  "id, title, organization, type, deadline, skill_tags, image, application_url";

export interface EventFilters {
  search?: string;
  category?: string;
  when?: "upcoming" | "past" | "all";
}

/**
 * Public event catalog.
 *
 * Cached and shared across all visitors: the result depends only on the filters,
 * never on who is asking. The explicit status filter keeps pending events out of
 * a signed-in organiser's browse view too, matching what RLS grants `anon`.
 *
 * Invalidated by `CACHE_TAGS.events` whenever an admin approves, rejects or
 * edits an event, so moderation still takes effect immediately.
 */
export const listEvents = cachedCatalog(
  queryEvents,
  "catalog-events",
  CACHE_TAGS.events,
  60,
);

async function queryEvents(filters: EventFilters) {
  const supabase = createPublicClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .in("status", ["approved", "completed"]);

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category as never);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `title.ilike.${term},description.ilike.${term},organizer.ilike.${term},location.ilike.${term}`,
    );
  }

  if (filters.when === "past") {
    query = query.lt("date", today).order("date", { ascending: false });
  } else if (filters.when === "all") {
    query = query.order("date", { ascending: false });
  } else {
    query = query.gte("date", today).order("date", { ascending: true });
  }

  const { data } = await query.limit(60);
  return (data ?? []) as EventCardData[];
}

/** The viewer's registration state for each event, keyed by event id. */
export async function getMyRegistrationMap(studentId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("event_registrations")
    .select("event_id, status")
    .eq("student_id", studentId);

  return new Map<string, RegistrationStatus>(
    (data ?? []).map((row) => [row.event_id, row.status as RegistrationStatus]),
  );
}

export async function getMyProgressMap(studentId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("opportunity_progress")
    .select("opportunity_id, status")
    .eq("student_id", studentId);

  return new Map<string, ProgressStatus>(
    (data ?? []).map((row) => [
      row.opportunity_id,
      row.status as ProgressStatus,
    ]),
  );
}

/** Single event with its registration count, for the details page. */
export async function getEventDetail(eventId: string) {
  const supabase = await createClient();

  const [eventResult, countResult] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
    supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("status", ["registered", "attended", "verified"]),
  ]);

  return {
    event: eventResult.data as Tables<"events"> | null,
    registrationCount: countResult.count ?? 0,
  };
}

export interface OpportunityFilters {
  search?: string;
  type?: string;
  skill?: string;
  deadline?: "open" | "soon" | "all";
}

export const listOpportunities = cachedCatalog(
  queryOpportunities,
  "catalog-opportunities",
  CACHE_TAGS.opportunities,
  60,
);

async function queryOpportunities(filters: OpportunityFilters) {
  const supabase = createPublicClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("opportunities")
    .select(OPPORTUNITY_COLUMNS)
    .eq("status", "published");

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type as never);
  }

  if (filters.skill && filters.skill !== "all") {
    query = query.contains("skill_tags", [filters.skill]);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `title.ilike.${term},description.ilike.${term},organization.ilike.${term}`,
    );
  }

  if (filters.deadline === "soon") {
    const soon = new Date();
    soon.setDate(soon.getDate() + 21);
    query = query
      .gte("deadline", today)
      .lte("deadline", soon.toISOString().slice(0, 10));
  } else if (filters.deadline !== "all") {
    // Default view hides expired deadlines but keeps rolling ones.
    query = query.or(`deadline.gte.${today},deadline.is.null`);
  }

  const { data } = await query
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(60);

  return (data ?? []) as OpportunityCardData[];
}

export async function getOpportunityDetail(id: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data as Tables<"opportunities"> | null;
}

/**
 * Shared certification catalog, used by the tracker and discovery.
 *
 * Cached for longer than the other catalogs: the credential list changes rarely.
 */
export const listCertifications = cachedCatalog(
  queryCertifications,
  "catalog-certifications",
  CACHE_TAGS.certifications,
  300,
);

async function queryCertifications(search?: string) {
  const supabase = createPublicClient();

  let query = supabase.from("certifications").select("*");

  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},provider.ilike.${term}`);
  }

  const { data } = await query.order("provider").order("name");
  return data ?? [];
}

export interface PublicListing {
  id: string;
  product_name: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  category: string;
  images: string[];
  contact_method: string;
  contact_value: string;
  seller: { full_name: string; username: string | null } | null;
}

/**
 * Approved marketplace listings with the seller's display name.
 *
 * Reads the `marketplace_public_listings` view instead of joining `profiles`:
 * `can_view_profile` is self-or-admin only, so a direct join would drop every
 * seller name to null. The view exposes the display name and the contact method
 * the seller deliberately published — never their account email.
 */
export const listListings = cachedCatalog(
  queryListings,
  "catalog-listings",
  CACHE_TAGS.listings,
  60,
);

async function queryListings(filters: {
  search?: string;
  category?: string;
}): Promise<PublicListing[]> {
  const supabase = createPublicClient();

  let query = supabase
    .from("marketplace_public_listings")
    .select(
      "id, product_name, description, price, currency, condition, category, images, contact_method, contact_value, created_at, seller_name, seller_username",
    );

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category as never);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`product_name.ilike.${term},description.ilike.${term}`);
  }

  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(48);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    product_name: row.product_name as string,
    description: row.description as string,
    price: row.price as number,
    currency: row.currency as string,
    condition: row.condition as string,
    category: row.category as string,
    images: (row.images as string[] | null) ?? [],
    contact_method: row.contact_method as string,
    contact_value: row.contact_value as string,
    seller: row.seller_name
      ? {
          full_name: row.seller_name as string,
          username: row.seller_username as string | null,
        }
      : null,
  }));
}
