import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Store,
  Target,
  Users,
} from "lucide-react";

import { requireRole } from "@/lib/auth";
import { getPlatformAnalytics } from "@/lib/queries/admin";
import { greeting } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";

export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const profile = await requireRole("admin");
  const analytics = await getPlatformAnalytics();

  const firstName = profile.full_name.split(" ")[0];

  const queue = [
    {
      label: "Events awaiting review",
      value: analytics?.events_pending ?? 0,
      href: "/admin/events",
      icon: ShieldCheck,
    },
    {
      label: "Sellers awaiting review",
      value: analytics?.sellers_pending ?? 0,
      href: "/admin/marketplace",
      icon: Store,
    },
    {
      label: "Listings awaiting review",
      value: analytics?.listings_pending ?? 0,
      href: "/admin/marketplace",
      icon: Store,
    },
  ];

  const outstanding = queue.reduce((total, item) => total + item.value, 0);

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-3xl border border-border/80 bg-card bg-orbit-mesh p-6 shadow-soft sm:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-[28px]">
          {greeting()}, {firstName} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {outstanding > 0
            ? `${outstanding} ${outstanding === 1 ? "item needs" : "items need"} your review. Moderation is what keeps CampusOrbit evidence trustworthy.`
            : "Nothing is waiting for review. The queue is clear."}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="brand">
            <Link href="/admin/events">
              <ShieldCheck aria-hidden />
              Review events
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/analytics">
              <BarChart3 aria-hidden />
              Analytics
            </Link>
          </Button>
        </div>
      </header>

      {/* Queue ------------------------------------------------------------- */}
      <section aria-labelledby="queue-heading" className="space-y-4">
        <h2
          id="queue-heading"
          className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
        >
          Moderation queue
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {queue.map((item) => (
            <Card
              key={item.label}
              interactive
              className={item.value > 0 ? "border-amber-200 bg-amber-50/50" : ""}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={
                      item.value > 0
                        ? "flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
                        : "flex size-9 items-center justify-center rounded-xl bg-secondary text-navy-500"
                    }
                  >
                    <item.icon className="size-[18px]" aria-hidden />
                  </span>
                  <p className="text-2xl font-semibold tabular-nums text-navy-900">
                    {item.value}
                  </p>
                </div>

                <p className="mt-3 text-sm font-medium text-navy-700">
                  {item.label}
                </p>

                <Link
                  href={item.href}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open queue
                  <ArrowRight className="size-3" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Platform totals --------------------------------------------------- */}
      <section aria-labelledby="totals-heading" className="space-y-4">
        <h2
          id="totals-heading"
          className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
        >
          Platform at a glance
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Students"
            value={analytics?.students ?? 0}
            icon={Users}
            href="/admin/users"
            tone="blue"
          />
          <StatCard
            label="Community leaders"
            value={analytics?.community_leaders ?? 0}
            icon={Users}
            href="/admin/users"
            tone="navy"
          />
          <StatCard
            label="Published events"
            value={analytics?.events_approved ?? 0}
            icon={CalendarDays}
            hint={`${analytics?.events_completed ?? 0} completed`}
            href="/admin/events"
            tone="emerald"
          />
          <StatCard
            label="Verified attendance"
            value={analytics?.verified_attendance ?? 0}
            icon={BadgeCheck}
            hint={`of ${analytics?.registrations ?? 0} registrations`}
            tone="emerald"
          />
          <StatCard
            label="Opportunities live"
            value={analytics?.opportunities ?? 0}
            icon={Target}
            href="/admin/opportunities"
            tone="blue"
          />
          <StatCard
            label="Certifications earned"
            value={analytics?.certifications_completed ?? 0}
            icon={GraduationCap}
            tone="amber"
          />
          <StatCard
            label="Marketplace listings"
            value={analytics?.listings ?? 0}
            icon={Store}
            href="/admin/marketplace"
            tone="navy"
          />
          <StatCard
            label="Public portfolios"
            value={analytics?.public_portfolios ?? 0}
            icon={BadgeCheck}
            hint="Students sharing their proof"
            tone="emerald"
          />
        </div>
      </section>
    </div>
  );
}
