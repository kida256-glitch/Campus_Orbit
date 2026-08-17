import type { Role } from "@/lib/constants";
import { getProfile } from "@/lib/auth";
import { MobileNav } from "@/components/shell/mobile-nav";
import { PublicHeader } from "@/components/shell/public-header";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

/**
 * Adaptive shell.
 *
 * The catalog routes in this group (discover, events, opportunities,
 * marketplace) are readable by anonymous visitors, so the layout renders the
 * public header for them and the full app shell for signed-in users. Routes
 * that genuinely require a session call `requireProfile()`/`requireRole()`
 * themselves, and RLS backs that up regardless.
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <main id="main" className="container py-8 sm:py-10">
          {children}
        </main>
      </div>
    );
  }

  const role = profile.role as Role;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-orbit-50/30">
      <Sidebar role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} />

        <main
          id="main"
          className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:pb-10"
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <MobileNav role={role} />
    </div>
  );
}
