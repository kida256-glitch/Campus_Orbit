import { Suspense } from "react";
import Link from "next/link";
import { Bell, Bot, Search } from "lucide-react";

import type { Role } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { NotificationBell } from "@/components/shell/notification-bell";
import { UserMenu } from "@/components/shell/user-menu";

export function Topbar({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-white/85 px-4 backdrop-blur-xl sm:px-6">
      {/* Subtle gradient line at the very top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-orbit-gradient"
        aria-hidden
      />

      {/* Mobile logo */}
      <div className="lg:hidden">
        <Logo markOnly />
      </div>

      {/* Search bar */}
      <Link
        href="/discover"
        className="ml-auto flex h-9 items-center gap-2.5 rounded-xl border border-border/80 bg-secondary/60 px-3.5 text-sm text-muted-foreground transition-all duration-200 hover:border-orbit-300 hover:bg-orbit-50/60 hover:text-orbit-700 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64 lg:ml-0"
      >
        <Search className="size-4 shrink-0 opacity-60" aria-hidden />
        <span className="hidden sm:inline">Search CampusOrbit</span>
      </Link>

      <div className="flex items-center gap-1.5 sm:ml-auto">
        {/* AI button for students */}
        {profile.role === "student" ? (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="hidden border-orbit-200 text-orbit-700 hover:bg-orbit-50 sm:flex"
          >
            <Link href="/assistant">
              <Bot className="size-3.5" aria-hidden />
              Ask AI
            </Link>
          </Button>
        ) : null}

        {/* Notifications */}
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

function BellPlaceholder() {
  return (
    <span className="flex size-10 items-center justify-center text-navy-400" aria-hidden>
      <Bell className="size-[18px]" />
    </span>
  );
}
