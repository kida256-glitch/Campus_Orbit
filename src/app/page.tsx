import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  CalendarDays,
  Compass,
  Megaphone,
  ScatterChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { APP_DESCRIPTION } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { PortfolioPreview } from "@/components/landing/portfolio-preview";

export const metadata = {
  title: "CampusOrbit — Your campus life. Your opportunities. Your proof.",
};

/**
 * Live counts for the landing page. These read only anon-visible rows
 * (approved events, published opportunities), so the numbers are real without
 * exposing anything private.
 */
async function getPublicStats() {
  try {
    const supabase = await createClient();

    const [events, opportunities, certifications] = await Promise.all([
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .in("status", ["approved", "completed"]),
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("certifications")
        .select("id", { count: "exact", head: true }),
    ]);

    return {
      events: events.count ?? 0,
      opportunities: opportunities.count ?? 0,
      certifications: certifications.count ?? 0,
    };
  } catch {
    // The landing page must render even if the database is unreachable.
    return null;
  }
}

export default async function LandingPage() {
  const stats = await getPublicStats();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main id="main">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-mesh-strong">
          {/* Floating decorative orbs */}
          <div className="glow-orb pointer-events-none absolute -top-40 left-1/4 size-[500px] bg-orbit-400/10 animate-float-slow" aria-hidden />
          <div className="glow-orb pointer-events-none absolute -bottom-20 right-0 size-[400px] bg-emeraldx-400/10 animate-float" aria-hidden />
          <div className="glow-orb pointer-events-none absolute top-1/2 left-0 size-[300px] bg-orbit-600/8 animate-spin-reverse-slow" aria-hidden />

          <div className="container grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-24">
            <div className="animate-fade-up">
              <Badge variant="outline" className="mb-6 bg-white/80 py-1 backdrop-blur border-orbit-200 text-orbit-700 shadow-sm">
                <Sparkles className="text-orbit-500" aria-hidden />
                For every school, university &amp; college
              </Badge>

              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-navy-900 sm:text-5xl lg:text-6xl">
                Your campus life.
                <br />
                Your opportunities.
                <br />
                <span className="text-gradient">Your proof.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {APP_DESCRIPTION}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" variant="brand">
                  <Link href="/discover">
                    Explore CampusOrbit
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-navy-200 hover:border-orbit-300">
                  <Link href="/signup">Build Your Portfolio</Link>
                </Button>
              </div>

              {stats ? (
                <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
                  {[
                    { label: "Live events", value: stats.events },
                    { label: "Open opportunities", value: stats.opportunities },
                    { label: "Tracked certifications", value: stats.certifications },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className="animate-fade-up"
                      style={{ animationDelay: `${300 + i * 80}ms` }}
                    >
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                        {stat.label}
                      </dt>
                      <dd className="text-2xl font-bold tracking-[-0.02em] text-navy-900 number-animate">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            {/* Portfolio preview — floats in from the right */}
            <div className="animate-slide-in-right lg:pl-4" style={{ animationDelay: "150ms" }}>
              <div className="relative">
                {/* Glow ring behind the preview card */}
                <div className="absolute -inset-4 rounded-3xl bg-orbit-gradient opacity-10 blur-2xl" aria-hidden />
                <PortfolioPreview />
              </div>
            </div>
          </div>
        </section>

        {/* ── The problem ──────────────────────────────────────── */}
        <section className="border-y border-border bg-secondary/40 py-16 sm:py-20">
          <div className="container">
            <div className="max-w-2xl">
              <SectionLabel>The problem</SectionLabel>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">
                Campus opportunities are scattered.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Events live in WhatsApp groups. Internships circulate on
                noticeboards. Certifications sit in forgotten browser tabs. A
                student can spend three years genuinely building things and
                still graduate with an empty CV, because nothing recorded what
                they did.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Nothing is in one place",
                  body: "Opportunities are announced across a dozen channels and expire before most students see them.",
                },
                {
                  title: "Participation leaves no trace",
                  body: "Attending a workshop produces no record an employer can check.",
                },
                {
                  title: "Portfolios are written, not earned",
                  body: "Students describe potential instead of showing evidence — and reviewers cannot tell them apart.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-background p-5 shadow-soft"
                >
                  <h3 className="text-sm font-semibold text-navy-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Discover → Participate → Build Proof                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <div className="max-w-2xl">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">
                Participate once. Get proof forever.
              </h2>
            </div>

            <ol className="mt-12 grid gap-6 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: Compass,
                  title: "Discover",
                  body: "Find events and opportunities relevant to you. CampusOrbit ranks them against your interests and the skills you have already demonstrated.",
                },
                {
                  step: "02",
                  icon: CalendarDays,
                  title: "Participate",
                  body: "Register for events and track opportunities from saved through to completed. Organisers confirm who actually showed up.",
                },
                {
                  step: "03",
                  icon: BadgeCheck,
                  title: "Build proof",
                  body: "Your verified activity automatically becomes portfolio evidence. No forms, no self-reporting — the record writes itself.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="group relative rounded-2xl border border-border bg-background p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-orbit-200 hover:shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-orbit-50 text-orbit-600 transition-colors group-hover:bg-orbit-gradient group-hover:text-white">
                      <item.icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold tracking-widest text-navy-200">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-navy-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>

            {/* The differentiator, stated plainly */}
            <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-navy-950 p-8 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                <div>
                  <Badge className="border-transparent bg-white/10 text-orbit-100">
                    <ShieldCheck aria-hidden />
                    Why it is trustworthy
                  </Badge>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                    Saying you attended is not the same as proof.
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-navy-200 sm:text-base">
                    CampusOrbit separates a student&apos;s claim from a
                    verified fact. Marking yourself as attending is just intent.
                    Only after the organiser confirms attendance does the
                    activity become evidence on your portfolio — and the record
                    stores who verified it and when.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: "Interested", tone: "muted" as const },
                    { label: "Registered", tone: "muted" as const },
                    { label: "Attended", tone: "pending" as const },
                    { label: "Verified — counts as proof", tone: "verified" as const },
                  ].map((rung, index) => (
                    <div
                      key={rung.label}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="text-[11px] font-semibold tabular-nums text-navy-300">
                        {index + 1}
                      </span>
                      <span className="text-sm text-white">{rung.label}</span>
                      {rung.tone === "verified" ? (
                        <BadgeCheck
                          className="ml-auto size-4 text-emeraldx-400"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* CampusOrbit AI                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-y border-border bg-secondary/40 py-16 sm:py-24">
          <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionLabel>Meet CampusOrbit AI</SectionLabel>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">
                Guidance grounded in what you have actually done.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Get personalised recommendations based on your real activity.
                CampusOrbit AI reads your verified events, completed
                certifications, opportunity progress and stated interests, then
                answers from that record. If the data is not there, it says so
                rather than inventing an answer.
              </p>

              <ul className="mt-6 space-y-2.5">
                {[
                  "What should I focus on next?",
                  "Which certifications suit my skills?",
                  "How strong is my portfolio right now?",
                  "Find me Web3 opportunities.",
                ].map((prompt) => (
                  <li
                    key={prompt}
                    className="flex items-center gap-2.5 text-sm text-navy-700"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-orbit-100">
                      <Bot className="size-3 text-orbit-600" aria-hidden />
                    </span>
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background p-5 shadow-card sm:p-6">
              <div className="space-y-4">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-orbit-gradient px-4 py-2.5 text-sm text-white">
                  What should I focus on next?
                </div>
                <div className="max-w-[92%] space-y-3 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-sm leading-relaxed text-navy-800">
                  <p>
                    Your evidence is strongest in cloud: three verified cloud
                    activities and two completed certifications. Web3 is
                    growing from one verified hackathon.
                  </p>
                  <p>
                    The clearest gap is data. You listed Data Analytics as an
                    interest but have no verified activity there yet, and the
                    Power BI masterclass on 18 August is still open.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Based on 3 verified events, 2 certifications and 2 completed
                    opportunities in your CampusOrbit record.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Leaders and universities                                         */}
        {/* ---------------------------------------------------------------- */}
        <section className="py-16 sm:py-24">
          <div className="container grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-7 shadow-soft sm:p-9">
              <span className="flex size-11 items-center justify-center rounded-xl bg-orbit-50 text-orbit-600">
                <Megaphone className="size-5" aria-hidden />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-navy-900">
                For community leaders
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Reach students through a trusted campus ecosystem. Submit an
                event once, get it reviewed, and see exactly who registered.
                Verifying attendance takes seconds and gives your community
                permanent credit in every attendee&apos;s portfolio.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-navy-700">
                {[
                  "Publish to students who opted into your topic",
                  "Track registrations per event",
                  "Verify attendance in one click",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <BadgeCheck
                      className="mt-0.5 size-4 shrink-0 text-emeraldx-500"
                      aria-hidden
                    />
                    {point}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/signup">
                  Organise on CampusOrbit
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-background p-7 shadow-soft sm:p-9">
              <span className="flex size-11 items-center justify-center rounded-xl bg-emeraldx-50 text-emeraldx-600">
                <Building2 className="size-5" aria-hidden />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-navy-900">
                For universities
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Create a structured technology ecosystem across campus. Instead
                of guessing at engagement, see which topics students turn up
                for, which communities are active, and how participation
                translates into credentials.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-navy-700">
                {[
                  "One moderated catalogue of campus tech activity",
                  "Verified participation data, not attendance guesses",
                  "Designed to extend beyond a single university",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <ScatterChart
                      className="mt-0.5 size-4 shrink-0 text-orbit-500"
                      aria-hidden
                    />
                    {point}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/discover">
                  See the ecosystem
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Final CTA                                                        */}
        {/* ---------------------------------------------------------------- */}
        <section className="pb-20 sm:pb-28">
          <div className="container">
            <div className="relative overflow-hidden rounded-3xl bg-orbit-gradient px-6 py-14 text-center sm:px-12 sm:py-20">
              <div
                aria-hidden
                className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl"
              />
              <h2 className="relative text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
                Start building your proof.
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-orbit-50 sm:text-base">
                Join CampusOrbit, choose what you care about, and let your
                participation do the work. The portfolio is the consequence, not
                the chore.
              </p>
              <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-orbit-700 hover:bg-orbit-50">
                  <Link href="/signup">
                    Create your account
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/portfolio/benjamin-ssekandi">
                    See a sample portfolio
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-orbit-600">
      {children}
    </span>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {[
            { label: "Discover", href: "/discover" },
            { label: "Events", href: "/events" },
            { label: "Opportunities", href: "/opportunities" },
            { label: "Marketplace", href: "/marketplace" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-secondary hover:text-navy-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" variant="brand">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Turning campus participation into career proof — for every school,
            university and college.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:gap-14">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-900">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                { label: "Discover", href: "/discover" },
                { label: "Events", href: "/events" },
                { label: "Opportunities", href: "/opportunities" },
                { label: "Marketplace", href: "/marketplace" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-navy-900">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-900">
              Get started
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/signup" className="hover:text-navy-900">
                  Create an account
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-navy-900">
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  href="/portfolio/benjamin-ssekandi"
                  className="hover:text-navy-900"
                >
                  Sample portfolio
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>CampusOrbit — a student project MVP. Demo data is illustrative.</p>
          <p>
            Not affiliated with, sponsored or endorsed by any organisation named
            in listings.
          </p>
        </div>
      </div>
    </footer>
  );
}
