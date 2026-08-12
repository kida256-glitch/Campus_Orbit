import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";

/**
 * Server Supabase client for Server Components, Server Actions and route
 * handlers. Uses the anon key: RLS remains the authorization boundary.
 *
 * NOT wrapped in React cache() — each call creates a fresh client with the
 * current cookie store snapshot. This is required for mutations: signIn,
 * signUp and signOut must be able to write new auth cookies, which silently
 * fails when a cached cookie-store snapshot is reused from a previous call in
 * the same request.
 *
 * getProfile() is the only hot read path that benefits from deduplication, and
 * it caches itself separately with React.cache().
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies. Session refresh is handled
            // by middleware, so this is safe to ignore.
          }
        },
      },
    },
  );
}
