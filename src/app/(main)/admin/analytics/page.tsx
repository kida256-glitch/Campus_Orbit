import {
  BadgeCheck,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Store,
  Target,
  UserRound,
  Users,
} from "lucide-react";

import { requireRole } from "@/lib/auth";
import { getPlatformAnalytics } from "@/lib/queries/admin";
import { percent } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";

export const metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  await requireRole("admin");
  const analytics = await getPlatformAnalytics();

  if (!analytics) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" />
        <p className="rounded-2xl border border-dashed border-border bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
          Analytics are unavailable right now.
        </p>
      </div>
    );
  }

  // The health metric that matters most: how much registration actually turns
  // into verified evidence.
  const verificationRate = percent(
    analytics.verified_attendance,
    analytics.registrations,
  );

  const publishRate = percent(analytics.events_approved, analytics.events_total);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Insight"
        title="Analytics"
        description="Ecosystem health across users, events, verified participation and the marketplace."
      />

      <section aria-labelledby="people-heading" className="space-y-4">
        <h2
          id="people-heading"
          className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
        >
          People
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Students"
            value={analytics.students}
            icon={Users}
            tone="blue"
          />
          <StatCard
            label="Community leaders"
            value={analytics.community_leaders}
            icon={UserRound}
            tone="navy"
          />
          <StatCard
            label="Administrators"
            value={analytics.admins}
            icon={ShieldCheck}
            tone="amber"
          />
          <StatCard
            label="Suspended"
            value={analytics.suspended}
            icon={Users}
            tone={analytics.suspended > 0 ? "red" : "navy"}
          />
        </div>
      </section>

      <section aria-labelledby="trust-heading" className="space-y-4">
        <h2
          id="trust-heading"
          className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
        >
          Trust and evidence
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-navy-700">
                  Verification rate
                </p>
                <p className="text-2xl font-semibold tabular-nums text-navy-900">
                  {verificationRate}%
                </p>
              </div>
              <Progress value={verificationRate} className="mt-3" />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {analytics.verified_attendance} of {analytics.registrations}{" "}
                registrations were verified by an organiser. This is the number
                that makes portfolios credible — unverified registrations never
                become evidence.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-navy-700">
                  Approval rate
                </p>
                <p className="text-2xl font-semibold tabular-nums text-navy-900">
                  {publishRate}%
                </p>
              </div>
              <Progress value={publishRate} className="mt-3" />
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {analytics.events_approved} approved, {analytics.events_pending}{" "}
                pending and {analytics.events_rejected} rejected out of{" "}
                {analytics.events_total} submissions.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Events total"
            value={analytics.events_total}
            icon={CalendarDays}
            hint={`${analytics.events_completed} completed`}
            tone="blue"
          />
          <StatCard
            label="Verified attendance"
            value={analytics.verified_attendance}
            icon={BadgeCheck}
            tone="emerald"
          />
          <StatCard
            label="Opportunities completed"
            value={analytics.opportunities_completed}
            icon={Target}
            hint={`${analytics.opportunities} live`}
            tone="blue"
          />
          <StatCard
            label="Certifications earned"
            value={analytics.certifications_completed}
            icon={GraduationCap}
            tone="amber"
          />
        </div>
      </section>

      <section aria-labelledby="marketplace-heading" className="space-y-4">
        <h2
          id="marketplace-heading"
          className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
        >
          Marketplace and sharing
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Live listings"
            value={analytics.listings}
            icon={Store}
            tone="navy"
          />
          <StatCard
            label="Listings pending"
            value={analytics.listings_pending}
            icon={Store}
            tone={analytics.listings_pending > 0 ? "amber" : "navy"}
          />
          <StatCard
            label="Sellers pending"
            value={analytics.sellers_pending}
            icon={ShieldCheck}
            tone={analytics.sellers_pending > 0 ? "amber" : "navy"}
          />
          <StatCard
            label="Public portfolios"
            value={analytics.public_portfolios}
            icon={BadgeCheck}
            hint={`of ${analytics.students} students`}
            tone="emerald"
          />
        </div>
      </section>

      <section aria-labelledby="charts-heading" className="space-y-4">
        <h2
          id="charts-heading"
          className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
        >
          Trends
        </h2>
        <AnalyticsCharts
          eventsByCategory={analytics.events_by_category ?? []}
          registrationsByStatus={analytics.registrations_by_status ?? []}
          signupsByWeek={analytics.signups_by_week ?? []}
        />
      </section>
    </div>
  );
}
