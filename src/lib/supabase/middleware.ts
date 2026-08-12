import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Role } from "@/lib/constants";
import type { Database } from "@/lib/types/database";

/**
 * Routes that never require a session here.
 *
 * `/api` is included because route handlers answer with proper status codes
 * (401/403) and JSON bodies. Redirecting an API call to an HTML login page
 * would give clients an unparseable 307 instead of a usable error.
 */
const PUBLIC_PREFIXES = [
  "/",
  "/api",
  "/login",
  "/signup",
  "/auth",
  "/portfolio",
  "/events",
  "/opportunities",
  "/marketplace",
  "/discover",
];

/** Routes only reachable while signed out. */
const AUTH_ONLY = ["/login", "/signup"];

/**
 * Role-scoped route prefixes.
 *
 * Checked here so a wrong-role visit is a real HTTP redirect rather than a
 * rendered shell that navigates on the client. Ordered most-specific first.
 */
const ROLE_PREFIXES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/leader", roles: ["community_leader", "admin"] },
  { prefix: "/dashboard", roles: ["student"] },
  { prefix: "/assistant", roles: ["student"] },
];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function homeFor(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "community_leader") return "/leader";
  return "/dashboard";
}

/**
 * Refreshes the Supabase session cookie on every request and performs coarse
 * route gating. This is a convenience layer only — real authorization is
 * enforced by RLS in the database, so a bypass here still cannot read or write
 * anything the signed-in user is not entitled to.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;

  /*
   * Identity check.
   *
   * `getClaims()` verifies the JWT rather than asking the Auth server about it.
   * With asymmetric signing keys it validates locally against a cached JWKS —
   * no network round trip on a request that middleware performs for *every*
   * navigation. With symmetric keys it falls back to a server call, so this is
   * never less safe than `getUser()`, and it is materially faster against hosted
   * Supabase where each round trip costs 100ms+.
   *
   * It is only used to answer "is there a valid session"; the role is still read
   * from the database below, never from token metadata.
   */
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;

  if (!userId && !isPublic(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (!userId) return response;

  // From here on there is a session, so role-dependent decisions are possible.
  // `/portfolio` is intentionally excluded from ROLE_PREFIXES because
  // `/portfolio/[username]` is public; that page guards itself.
  const roleScoped = ROLE_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const needsRole = roleScoped !== undefined;
  const isAuthOnly = AUTH_ONLY.includes(pathname);

  if (!needsRole && !isAuthOnly) return response;

  // One lookup, only for routes whose outcome depends on the role. RLS lets a
  // user read their own profile row, so this needs no elevated key.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, suspended")
    .eq("id", userId)
    .maybeSingle();

  const role = (profile?.role ?? "student") as Role;

  if (profile?.suspended) {
    if (pathname === "/suspended") return response;
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/suspended";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  if (isAuthOnly) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = homeFor(role);
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  if (roleScoped && !roleScoped.roles.includes(role)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = homeFor(role);
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}
