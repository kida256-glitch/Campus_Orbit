import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/constants";
import type { Tables } from "@/lib/types/database";

export type Profile = Tables<"profiles">;

/**
 * The signed-in user's profile, or null.
 *
 * Wrapped in React `cache()` so it runs **once per request** no matter how many
 * components ask for it. Before this, a single signed-in navigation performed
 * three `auth.getUser()` calls and three `profiles` selects — the layout, the
 * page guard and the topbar each fetched independently. Locally that cost ~80ms
 * of pure duplication; against hosted Supabase, where each round trip is
 * 100ms+, it was the single largest source of latency.
 *
 * The role always comes from this database row — never from client state or JWT
 * metadata — so a tampered token cannot grant a role the database has not
 * recorded.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data ?? null;
});

/** Redirects to login when there is no session. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) redirect("/login");

  // A suspended account keeps its session but loses access to the app.
  if (profile.suspended) redirect("/suspended");

  return profile;
}

/**
 * Guards a route to specific roles and sends everyone else to their own
 * dashboard.
 *
 * Convenience and defence in depth only: middleware already redirects
 * wrong-role requests before render, and RLS enforces the real boundary. Because
 * `getProfile` is memoized, calling this in a page after the layout has already
 * resolved the profile costs nothing.
 */
export async function requireRole(...roles: Role[]): Promise<Profile> {
  const profile = await requireProfile();

  if (!roles.includes(profile.role)) {
    redirect(dashboardPathFor(profile.role));
  }

  return profile;
}

/** Landing route for each role after sign-in. */
export function dashboardPathFor(role: Role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "community_leader":
      return "/leader";
    default:
      return "/dashboard";
  }
}
