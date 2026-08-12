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
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { EventCard } from "@/components/shared/event-card";
import { OpportunityCard } from "@/components/shared/opportunity-card";
import { RegistrationButtons } from "@/components/events/registration-buttons";
import { ProgressButtons } from "@/components/opportunities/progress-buttons";

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
  const topSkills = skills.filter((skill) => skill.verified_count > 0).slice(0, 4);
  const earned = achievements(stats);

  return (
    <div className="space-y-8">
      {/* Header ------------------------------------------------------------ */}
      <header className="overflow-hidden rounded-3xl border border-border/80 bg-card bg-orbit-mesh p-6 shadow-soft sm:p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-[28px]">
          {greeting()}, {firstName} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening in your campus tech journey.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-sm">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orbit-700">
                Profile completion
              </p>
              <p className="text-sm font-semibold tabular-nums text-navy-900">
                {completion}%
              </p>
            </div>
            <Progress value={completion} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {completion >= 90
                ? "Your profile is recruiter-ready."
                : "A fuller profile sharpens your recommendations."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="brand">
              <Link href="/portfolio">
                <BadgeCheck aria-hidden />
                View my portfolio
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/discover">
                <Compass aria-hidden />
                Discover
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Activity stats ---------------------------------------------------- */}
      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="sr-only">
          Your activity
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Events attended"
            value={stats?.verified_events ?? 0}
            icon={CalendarDays}
            hint="Verified by organisers"
            href="/events"
            tone="blue"
          />
          <StatCard
            label="Opportunities completed"
            value={stats?.opportunities_completed ?? 0}
            icon={Target}
            hint={`${stats?.opportunities_in_progress ?? 0} in progress`}
            href="/opportunities"
            tone="emerald"
          />
          <StatCard
            label="Certifications"
            value={stats?.certifications_completed ?? 0}
            icon={GraduationCap}
            hint={`${stats?.certifications_in_progress ?? 0} in progress`}
            href="/portfolio"
            tone="amber"
          />
          <StatCard
            label="Skills evidenced"
            value={stats?.skills ?? 0}
            icon={Sparkles}
            hint="Backed by verified activity"
            href="/portfolio"
            tone="navy"
          />
        </div>
      </section>

      {/* Upcoming events --------------------------------------------------- */}
      <section aria-labelledby="upcoming-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              id="upcoming-heading"
              className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
            >
              Upcoming events
            </h2>
            <p className="text-sm text-muted-foreground">
              Approved events happening on campus soon.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/events">
              All events
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        {upcomingEvents.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events yet"
            description="Once organisers submit events and an administrator approves them, they'll appear here."
            action={{ label: "Browse past events", href: "/events?when=past" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
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
            ))}
          </div>
        )}
      </section>

      {/* Recommendations --------------------------------------------------- */}
      <section aria-labelledby="recommended-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              id="recommended-heading"
              className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
            >
              Recommended for you
            </h2>
            <p className="text-sm text-muted-foreground">
              Scored against your interests and the skills you have already
              evidenced.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/opportunities">
              All opportunities
              <ArrowRight aria-hidden />
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
            {recommendations.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                matched={opportunity.matched}
                actions={
                  <ProgressButtons
                    opportunityId={opportunity.id}
                    status={null}
                  />
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Portfolio preview + AI ------------------------------------------- */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Your portfolio so far</CardTitle>
                <CardDescription>
                  Built automatically from verified activity — nothing here was
                  typed in by hand.
                </CardDescription>
              </div>
              <Badge variant="verified">
                <BadgeCheck aria-hidden />
                Auto-built
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <p className="text-sm leading-relaxed text-navy-700">
              {careerSnapshot(
                profile.full_name,
                profile.university,
                stats,
                skills,
              )}
            </p>

            {topSkills.length > 0 ? (
              <ul className="space-y-2.5">
                {topSkills.map((skill) => {
                  const value = skillProficiency(skill);
                  return (
                    <li key={skill.skill}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium text-navy-800">
                          {skill.skill}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {skill.verified_count} verified
                        </span>
                      </div>
                      <Progress value={value} className="mt-1.5 h-1.5" />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
                Skills appear here once an organiser verifies your attendance or
                you complete a certification.
              </p>
            )}

            {earned.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {earned.slice(0, 4).map((item) => (
                  <li key={item.label}>
                    <Badge variant="secondary">
                      <CircleCheck aria-hidden />
                      {item.text}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}

            <Button asChild variant="outline" size="sm">
              <Link href="/portfolio">
                View my portfolio
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-orbit-gradient text-white">
          <CardHeader>
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Bot className="size-5" aria-hidden />
            </span>
            <CardTitle className="mt-3 text-lg text-white">
              Not sure what to focus on next?
            </CardTitle>
            <CardDescription className="text-white/85">
              CampusOrbit AI reads your actual verified activity — never guesses
              — and suggests the next useful step.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" size="sm">
              <Link href="/assistant">
                Ask CampusOrbit AI
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Certifications ---------------------------------------------------- */}
      {certifications.length > 0 ? (
        <section aria-labelledby="certs-heading" className="space-y-4">
          <h2
            id="certs-heading"
            className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
          >
            Certifications
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {certifications.map((cert) => (
              <Card key={cert.id} className="p-4">
                <Badge
                  variant={cert.status === "completed" ? "verified" : "pending"}
                >
                  {cert.status === "completed" ? "Completed" : "In progress"}
                </Badge>
                <p className="mt-2.5 text-sm font-semibold leading-snug text-navy-900">
                  {cert.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cert.provider}
                </p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
