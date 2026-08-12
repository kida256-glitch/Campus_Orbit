import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Service-role client. Bypasses RLS entirely, so it is confined to a small set
 * of genuinely administrative operations (listing auth users, provisioning
 * accounts). `server-only` makes bundling this into a client component a build
 * error rather than a leak.
 *
 * Callers must still verify the requester is an admin — this client will not do
 * it for them.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Admin-only features are unavailable.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
