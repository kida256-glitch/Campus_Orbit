import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarDays,
  CircleCheck,
  Compass,
  GraduationCap,
  Sparkles,
  Target,
} from "lucide-react";

import { requireRole } from "@/lib/auth";
import { getStudentDashboard } from "@/lib/queries/student";
import { greeting } from "@/lib/utils";
import { achievements, careerSnapshot, skillProficiency } from "@/lib/portfolio";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { EventCard } from "@/components/shared/event-card";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { RegistrationButtons } from "@/components/events/registration-buttons";
import { ProgressButtons } from "@/components/opportunities/progress-buttons";
import { AnimatedShaderBackground } from "@/components/ui/animated-shader-background";

export const metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  const profile = await requireRole("student");
  const {
    stats,
    completion,
    skills,
    upcomingEvents,
    registrationByEvent,
    recommendations,
    certifications,
  } = await getStudentDashboard(profile.id);

  const firstName = profile.full_name.split(" ")[0];
  const topSkills = skills.filter((s) => s.verified_count > 0).slice(0, 4);
  const earned = achievements(stats);

  return (
    <div className="space-y-8">
      {/* ── Hero header ─────────────────────────────────────────── */}
      <header className="animate-fade-up relative overflow-hidden rounded-3xl border border-orbit-100/80 bg-gradient-to-br from-orbit-600 via-orbit-700 to-navy-800 p-6 shadow-glow-lg sm:p-8">
        {/* Shader aurora behind the greeting */}
        <AnimatedShaderBackground opacity={0.45} className="rounded-3xl" />

        <div className="relative">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
            {greeting()}, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-white/70">
            Here&apos;s what&apos;s happening in your campus tech journey.
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full max-w-sm">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/80">
                  Profile completion
                </p>
                <p className="text-sm font-bold tabular-nums text-white">
                  {completion}%
                </p>
              </div>
              {/* Custom white progress bar */}
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-1000 ease-out"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-white/60">
                {completion >= 90
                  ? "Your profile is recruiter-ready ✓"
                  : "A fuller profile sharpens your recommendations."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm" className="bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur">
                <Link href="/portfolio">
                  <BadgeCheck aria-hidden />
                  My portfolio
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-white text-orbit-700 hover:bg-white/90 shadow-sm">
                <Link href="/discover">
                  <Compass aria-hidden />
                  Discover
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="sr-only">Your activity</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Events attended"
            value={stats?.verified_events ?? 0}
            icon={CalendarDays}
            hint="Verified by organisers"
            href="/events"
            tone="blue"
            stagger={1}
          />
          <StatCard
            label="Opportunities"
            value={stats?.opportunities_completed ?? 0}
            icon={Target}
            hint={`${stats?.opportunities_in_progress ?? 0} in progress`}
            href="/opportunities"
            tone="emerald"
            stagger={2}
          />
          <StatCard
            label="Certifications"
            value={stats?.certifications_completed ?? 0}
            icon={GraduationCap}
            hint={`${stats?.certifications_in_progress ?? 0} in progress`}
            href="/portfolio"
            tone="amber"
            stagger={3}
          />
          <StatCard
            label="Skills evidenced"
            value={stats?.skills ?? 0}
            icon={Sparkles}
            hint="Backed by verified activity"
            href="/portfolio"
            tone="navy"
            stagger={4}
          />
        </div>
      </section>

      {/* ── Upcoming events ─────────────────────────────────────── */}
      <section aria-labelledby="upcoming-heading" className="animate-fade-up space-y-4" style={{ animationDelay: "200ms" }}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="upcoming-heading" className="text-lg font-semibold tracking-[-0.01em] text-navy-900">
              Upcoming events
            </h2>
            <p className="text-sm text-muted-foreground">
              Approved events happening on campus soon.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-orbit-600 hover:text-orbit-700 hover:bg-orbit-50">
            <Link href="/events">
              All events <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        {upcomingEvents.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events yet"
            description="Once organisers submit events and an administrator approves them, they'll appear here."
            action={{ label: "Browse events", href: "/events" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcomingEvents.map((event, i) => (
              <div
                key={event.id}
                className="animate-fade-up"
                style={{ animationDelay: `${250 + i * 60}ms` }}
              >
                <EventCard
                  event={event}
                  registrationStatus={registrationByEvent.get(event.id) ?? null}
                  footer={
                    <RegistrationButtons
                      eventId={event.id}
                      status={registrationByEvent.get(event.id) ?? null}
                      compact
                    />
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Recommendations ─────────────────────────────────────── */}
      <section aria-labelledby="recommended-heading" className="animate-fade-up space-y-4" style={{ animationDelay: "300ms" }}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="recommended-heading" className="text-lg font-semibold tracking-[-0.01em] text-navy-900">
              Recommended for you
            </h2>
            <p className="text-sm text-muted-foreground">
              Scored against your interests and evidenced skills.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-orbit-600 hover:text-orbit-700 hover:bg-orbit-50">
            <Link href="/opportunities">
              All opportunities <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        {recommendations.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No recommendations yet"
            description="Add a few interests to your profile and CampusOrbit will start matching opportunities to you."
            action={{ label: "Update interests", href: "/profile" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recommendations.map((opp, i) => (
              <div
                key={opp.id}
                className="animate-fade-up"
                style={{ animationDelay: `${350 + i * 60}ms` }}
              >
                <OpportunityCard
                  opportunity={opp}
                  matched={opp.matched}
                  actions={<ProgressButtons opportunityId={opp.id} status={null} />}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Portfolio preview + AI ───────────────────────────────── */}
      <section className="animate-fade-up grid gap-4 lg:grid-cols-3" style={{ animationDelay: "400ms" }}>
        {/* Portfolio preview */}
        <Card className="lg:col-span-2 overflow-hidden border-orbit-100/80">
          <div className="h-1 w-full bg-orbit-gradient" />
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Your portfolio so far</CardTitle>
                <CardDescription>
                  Built automatically from verified activity — nothing here was typed by hand.
                </CardDescription>
              </div>
              <Badge className="bg-emeraldx-50 text-emeraldx-700 border-emeraldx-200">
                <BadgeCheck aria-hidden />
                Auto-built
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <p className="text-sm leading-relaxed text-navy-700">
              {careerSnapshot(profile.full_name, profile.university, stats, skills)}
            </p>

            {topSkills.length > 0 ? (
              <ul className="space-y-3">
                {topSkills.map((skill, i) => {
                  const value = skillProficiency(skill);
                  return (
                    <li key={skill.skill} className="animate-fade-up-sm" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium text-navy-800">{skill.skill}</span>
                        <span className="text-xs text-muted-foreground">
                          {skill.verified_count} verified
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-orbit-100">
                        <div
                          className="h-full rounded-full bg-orbit-gradient transition-all duration-1000 ease-out"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
                Skills appear here once an organiser verifies your attendance or you complete a certification.
              </p>
            )}

            {earned.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {earned.slice(0, 4).map((item) => (
                  <li key={item.label}>
                    <Badge variant="secondary" className="bg-orbit-50 text-orbit-700 border-orbit-100">
                      <CircleCheck aria-hidden />
                      {item.text}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}

            <Button asChild variant="outline" size="sm" className="border-orbit-200 text-orbit-700 hover:bg-orbit-50">
              <Link href="/portfolio">
                View my portfolio <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* AI assistant card */}
        <Card className="relative overflow-hidden border-0 bg-orbit-gradient text-white shadow-glow">
          {/* Floating orb */}
          <div className="pointer-events-none absolute -right-8 -top-8 size-32 animate-float rounded-full bg-white/[0.07] blur-2xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-6 left-6 size-20 animate-float-slow rounded-full bg-emeraldx-400/15 blur-xl" aria-hidden />

          <CardHeader className="relative">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 shadow-inner-glow backdrop-blur animate-pulse-glow">
              <Bot className="size-5" aria-hidden />
            </span>
            <CardTitle className="mt-3 text-lg text-white">
              Not sure what to focus on next?
            </CardTitle>
            <CardDescription className="text-white/80">
              CampusOrbit AI reads your actual verified activity and suggests the next useful step.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <Button asChild size="sm" className="bg-white text-orbit-700 hover:bg-white/90 shadow-sm">
              <Link href="/assistant">
                Ask CampusOrbit AI <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ── Certifications ──────────────────────────────────────── */}
      {certifications.length > 0 ? (
        <section aria-labelledby="certs-heading" className="animate-fade-up space-y-4" style={{ animationDelay: "450ms" }}>
          <h2 id="certs-heading" className="text-lg font-semibold tracking-[-0.01em] text-navy-900">
            Certifications
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {certifications.map((cert, i) => (
              <div
                key={cert.id}
                className="animate-fade-up rounded-2xl border border-border/80 bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                style={{ animationDelay: `${500 + i * 60}ms` }}
              >
                <Badge
                  className={cert.status === "completed"
                    ? "bg-emeraldx-50 text-emeraldx-700 border-emeraldx-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"}
                >
                  {cert.status === "completed" ? "Completed" : "In progress"}
                </Badge>
                <p className="mt-2.5 text-sm font-semibold leading-snug text-navy-900">
                  {cert.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cert.provider}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
