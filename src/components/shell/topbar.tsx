import { Suspense } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";

import type { Role } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { NotificationBell } from "@/components/shell/notification-bell";
import { UserMenu } from "@/components/shell/user-menu";

/**
 * Signed-in header: brand on mobile, quick search, notifications, account.
 *
 * Deliberately synchronous. The notification queries live in a streamed child so
 * they never delay the page body — the bell used to add two round trips to the
 * critical path of every single navigation, for a control most visitors never
 * open.
 */
export function Topbar({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6">
      <div className="lg:hidden">
        <Logo markOnly />
      </div>

      <Link
        href="/discover"
        className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-input bg-secondary/60 px-3 text-sm text-muted-foreground transition-colors hover:border-orbit-200 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64 lg:ml-0"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Search CampusOrbit</span>
      </Link>

      <div className="flex items-center gap-1.5 sm:ml-auto">
        {profile.role === "student" ? (
          <Button asChild size="sm" variant="outline" className="hidden sm:flex">
            <Link href="/assistant">Ask CampusOrbit AI</Link>
          </Button>
        ) : null}

        <Suspense fallback={<BellPlaceholder />}>
          <NotificationBellData />
        </Suspense>

        <UserMenu
          fullName={profile.full_name}
          email={profile.email}
          role={profile.role as Role}
          avatarUrl={profile.avatar_url}
          username={profile.username}
        />
      </div>
    </header>
  );
}

/** Fetched off the critical path; the shell renders without waiting for it. */
async function NotificationBellData() {
  const supabase = await createClient();

  const [{ data: notifications }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false),
  ]);

  return (
    <NotificationBell
      notifications={notifications ?? []}
      unreadCount={unreadCount ?? 0}
    />
  );
}

/** Same footprint as the real bell, so the header does not shift on load. */
function BellPlaceholder() {
  return (
    <span
      className="flex size-10 items-center justify-center text-navy-400"
      aria-hidden
    >
      <Bell className="size-[18px]" />
    </span>
  );
}
