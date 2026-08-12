import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Braces,
  Briefcase,
  CalendarDays,
  ExternalLink,
  Globe,
  GraduationCap,
  Mail,
  Sparkles,
  Target,
} from "lucide-react";
// lucide-react v1 removed brand marks, so GitHub/LinkedIn use neutral icons
// alongside their text labels rather than unlabelled generic glyphs.
import { format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { VerifiedMark } from "@/components/shared/status-badge";
import {
  achievements,
  careerSnapshot,
  evidenceLabel,
  skillProficiency,
} from "@/lib/portfolio";
import type { PortfolioSkill, PortfolioStats } from "@/lib/queries/student";
import { initials } from "@/lib/utils";

export interface PortfolioViewData {
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  university: string;
  email: string | null;
  links: { github?: string; linkedin?: string; website?: string };
  stats: PortfolioStats | null;
  skills: PortfolioSkill[];
  experience: {
    kind: "event" | "opportunity";
    title: string;
    subtitle: string;
    category: string;
    occurred_on: string | null;
    verified: boolean;
  }[];
  certifications: {
    name: string;
    provider: string;
    skills: string[];
    completion_date: string | null;
    credential_url: string | null;
  }[];
}

/**
 * The portfolio, rendered identically for the owner and for a public visitor.
 *
 * Every section is a projection of verified activity. There is no field a
 * student can type into here by design — the page has nothing to say until the
 * underlying evidence exists, which is what makes the ✓ Verified marks
 * meaningful.
 */
export function PortfolioView({
  data,
  actions,
}: {
  data: PortfolioViewData;
  actions?: React.ReactNode;
}) {
  const { stats, skills } = data;
  const evidencedSkills = skills.filter((skill) => skill.verified_count > 0);
  const declaredOnly = skills.filter((skill) => skill.verified_count === 0);
  const earned = achievements(stats);

  const events = data.experience.filter((item) => item.kind === "event");
  const opportunities = data.experience.filter(
    (item) => item.kind === "opportunity",
  );

  const hasAnything =
    data.experience.length > 0 ||
    data.certifications.length > 0 ||
    evidencedSkills.length > 0;

  return (
    <div className="space-y-6">
      {/* Hero -------------------------------------------------------------- */}
      <section className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-soft">
        <div className="h-24 bg-orbit-gradient sm:h-32" />

        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar className="size-24 border-4 border-card shadow-card sm:size-28">
                {data.avatarUrl ? (
                  <AvatarImage src={data.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback className="bg-navy-100 text-xl font-semibold text-navy-700">
                  {initials(data.fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 sm:pb-1">
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-3xl">
                  {data.fullName}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <GraduationCap className="size-4 shrink-0" aria-hidden />
                  {data.university}
                </p>
              </div>
            </div>

            {actions ? (
              <div className="flex flex-wrap items-center gap-2 sm:pb-1">
                {actions}
              </div>
            ) : null}
          </div>

          {data.bio ? (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-navy-700">
              {data.bio}
            </p>
          ) : null}

          {/* Social links + opt-in contact ---------------------------------- */}
          <ul className="mt-5 flex flex-wrap items-center gap-2">
            {data.links.github ? (
              <li>
                <SocialLink
                  href={data.links.github}
                  icon={Braces}
                  label="GitHub"
                />
              </li>
            ) : null}
            {data.links.linkedin ? (
              <li>
                <SocialLink
                  href={data.links.linkedin}
                  icon={Briefcase}
                  label="LinkedIn"
                />
              </li>
            ) : null}
            {data.links.website ? (
              <li>
                <SocialLink
                  href={data.links.website}
                  icon={Globe}
                  label="Website"
                />
              </li>
            ) : null}
            {data.email ? (
              <li>
                <SocialLink
                  href={`mailto:${data.email}`}
                  icon={Mail}
                  label={data.email}
                />
              </li>
            ) : null}
          </ul>
        </div>
      </section>

      {!hasAnything ? (
        <EmptyState
          icon={Sparkles}
          title="This portfolio is still empty"
          description="CampusOrbit builds a portfolio from verified activity. Attend an event and get verified, or complete an opportunity or certification, and evidence appears here automatically."
          action={{ label: "Discover events", href: "/discover" }}
          hint="Nothing on this page is typed in by hand — that is what makes it credible."
        />
      ) : null}

      {/* Career snapshot --------------------------------------------------- */}
      {hasAnything ? (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-orbit-600" aria-hidden />
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-orbit-700">
                Career snapshot
              </h2>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-navy-800">
              {careerSnapshot(
                data.fullName,
                data.university,
                stats,
                skills,
              )}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Generated from verified CampusOrbit activity, not self-reported
              claims.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Achievements ------------------------------------------------------ */}
      {earned.length > 0 ? (
        <section aria-labelledby="achievements-heading">
          <h2
            id="achievements-heading"
            className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
          >
            Achievements
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {earned.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/80 bg-card p-4 shadow-soft"
              >
                <p className="text-2xl font-semibold tabular-nums text-navy-900">
                  {item.value}
                </p>
                <p className="mt-1 text-xs capitalize leading-relaxed text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Skills ------------------------------------------------------------ */}
      {skills.length > 0 ? (
        <section aria-labelledby="skills-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2
                id="skills-heading"
                className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
              >
                Skills
              </h2>
              <p className="text-sm text-muted-foreground">
                Proficiency reflects how much verified evidence supports each
                skill.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {evidencedSkills.map((skill) => {
              const value = skillProficiency(skill);
              return (
                <div
                  key={skill.skill}
                  className="rounded-2xl border border-border/80 bg-card p-4 shadow-soft"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold text-navy-900">
                      {skill.skill}
                    </p>
                    <VerifiedMark
                      label={`${skill.verified_count} evidence`}
                    />
                  </div>
                  <Progress value={value} className="mt-2.5 h-2" />
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {evidenceLabel(skill)}
                  </p>
                </div>
              );
            })}
          </div>

          {declaredOnly.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-secondary/40 p-4">
              <p className="text-xs font-medium text-navy-700">
                Also listed by {data.fullName.split(" ")[0]} — no verified
                evidence yet
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {declaredOnly.map((skill) => (
                  <li key={skill.skill}>
                    <Badge variant="muted">{skill.skill}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Verified experience ---------------------------------------------- */}
      {data.experience.length > 0 ? (
        <section aria-labelledby="experience-heading">
          <h2
            id="experience-heading"
            className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
          >
            Verified experience
          </h2>
          <p className="text-sm text-muted-foreground">
            {events.length > 0 && opportunities.length > 0
              ? `${events.length} verified events and ${opportunities.length} completed opportunities.`
              : events.length > 0
                ? `${events.length} verified ${events.length === 1 ? "event" : "events"}.`
                : `${opportunities.length} completed ${opportunities.length === 1 ? "opportunity" : "opportunities"}.`}
          </p>

          <ol className="mt-4 space-y-3">
            {data.experience.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className="flex items-start gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-soft"
              >
                <span
                  className={
                    item.kind === "event"
                      ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-orbit-50 text-orbit-600"
                      : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-emeraldx-50 text-emeraldx-600"
                  }
                >
                  {item.kind === "event" ? (
                    <CalendarDays className="size-[18px]" aria-hidden />
                  ) : (
                    <Target className="size-[18px]" aria-hidden />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold leading-snug text-navy-900">
                      {item.title}
                    </p>
                    <VerifiedMark />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.category}</Badge>
                    {item.occurred_on ? (
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(`${item.occurred_on}T00:00:00`),
                          "MMM yyyy",
                        )}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Certifications --------------------------------------------------- */}
      {data.certifications.length > 0 ? (
        <section aria-labelledby="certifications-heading">
          <h2
            id="certifications-heading"
            className="text-lg font-semibold tracking-[-0.01em] text-navy-900"
          >
            Certifications
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.certifications.map((cert, index) => (
              <div
                key={`${cert.name}-${index}`}
                className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Award className="size-[18px]" aria-hidden />
                  </span>
                  <BadgeCheck
                    className="size-5 text-emeraldx-600"
                    aria-label="Completed"
                  />
                </div>

                <p className="mt-3 text-sm font-semibold leading-snug text-navy-900">
                  {cert.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cert.provider}
                </p>

                {cert.skills.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {cert.skills.map((skill) => (
                      <li key={skill}>
                        <Badge variant="outline">{skill}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  {cert.completion_date ? (
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(`${cert.completion_date}T00:00:00`),
                        "MMM yyyy",
                      )}
                    </span>
                  ) : (
                    <span />
                  )}

                  {cert.credential_url ? (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-orbit-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Credential
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <p className="pt-2 text-center text-xs text-muted-foreground">
        Built automatically by{" "}
        <Link href="/" className="font-medium text-primary hover:underline">
          CampusOrbit
        </Link>{" "}
        from verified campus activity.
      </p>
    </div>
  );
}

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Globe;
  label: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:border-orbit-200 hover:text-orbit-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </a>
  );
}
