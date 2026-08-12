import "server-only";

import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Cookie-free Supabase client for genuinely public data.
 *
 * Two reasons this exists rather than reusing the request-scoped client:
 *
 * 1. `unstable_cache` forbids reading cookies inside a cached function, so a
 *    session-bound client cannot be used there.
 * 2. It is more correct. A public catalog read should not depend on who is
 *    asking — using the plain `anon` role makes that explicit and means one
 *    cached result is safely shared by every visitor.
 *
 * It carries no session, so it can only ever see what RLS grants `anon`:
 * approved events, published opportunities, the certification catalog and
 * approved marketplace listings. It is not a privilege escalation path.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Cache tags for the four public catalogs, invalidated by moderation actions. */
export const CACHE_TAGS = {
  events: "catalog:events",
  opportunities: "catalog:opportunities",
  certifications: "catalog:certifications",
  listings: "catalog:listings",
} as const;

/**
 * Wraps a public catalog query in the data cache — in production only.
 *
 * Caching is skipped in development on purpose. `npm run db:reset` and direct
 * SQL changes cannot fire `revalidateTag`, so a cached dev server would keep
 * serving pre-reset data for up to the revalidate window. Losing a few
 * milliseconds locally is worth having the page always agree with the database.
 */
export function cachedCatalog<A, R>(
  query: (args: A) => Promise<R>,
  key: string,
  tag: string,
  revalidate: number,
): (args: A) => Promise<R> {
  if (process.env.NODE_ENV !== "production") return query;

  return (args: A) =>
    unstable_cache(query, [key], { tags: [tag], revalidate })(args);
}
