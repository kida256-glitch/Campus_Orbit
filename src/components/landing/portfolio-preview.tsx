import { BadgeCheck, Bot, CalendarDays, Sparkles } from "lucide-react";

import { OrbitMark } from "@/components/brand/logo";

/**
 * Static hero visual: a compressed impression of the student dashboard feeding
 * a portfolio. Deliberately illustrative rather than live data, so the landing
 * page stays fast and renders identically for signed-out visitors.
 */
export function PortfolioPreview() {
  const skills = [
    { name: "Cloud Computing", value: 82 },
    { name: "Web3", value: 68 },
    { name: "AI", value: 61 },
  ];

  return (
    <div className="relative">
      {/* Glow behind the mock */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-orbit-gradient opacity-[0.14] blur-2xl"
      />

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-card">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border/70 bg-secondary/60 px-4 py-3">
          <OrbitMark className="size-6 rounded-lg" />
          <span className="text-xs font-medium text-navy-700">
            CampusOrbit · Portfolio
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emeraldx-50 px-2 py-0.5 text-[10px] font-semibold text-emeraldx-700">
            <BadgeCheck className="size-3" aria-hidden />
            Verified
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Identity row */}
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-orbit-gradient text-sm font-semibold text-white">
              BS
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy-900">
                Alex Mutua
              </p>
              <p className="truncate text-xs text-muted-foreground">
                University of Nairobi
              </p>
            </div>
          </div>

          {/* Achievement counters */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Verified events", value: "12" },
              { label: "Certifications", value: "4" },
              { label: "Hackathons", value: "3" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/70 bg-secondary/50 p-2.5"
              >
                <p className="text-lg font-semibold leading-none text-navy-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Evidence-backed skills */}
          <div className="space-y-2.5 rounded-xl border border-border/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Skills from verified activity
            </p>
            {skills.map((skill) => (
              <div key={skill.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-navy-800">{skill.name}</span>
                  <span className="text-muted-foreground">{skill.value}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
                  <div
                    className="h-full rounded-full bg-orbit-gradient"
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Evidence trail */}
          <div className="space-y-2">
            {[
              { icon: CalendarDays, text: "Web3 Builders Hackathon" },
              { icon: Sparkles, text: "AWS Cloud Practitioner" },
            ].map((row) => (
              <div
                key={row.text}
                className="flex items-center gap-2.5 rounded-xl border border-border/70 px-3 py-2"
              >
                <row.icon className="size-3.5 shrink-0 text-orbit-500" aria-hidden />
                <span className="truncate text-xs text-navy-800">{row.text}</span>
                <BadgeCheck
                  className="ml-auto size-3.5 shrink-0 text-emeraldx-500"
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating AI card */}
      <div className="absolute -bottom-6 -left-4 hidden w-56 rounded-xl border border-border/70 bg-background p-3 shadow-card sm:block lg:-left-10">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-orbit-gradient">
            <Bot className="size-3.5 text-white" aria-hidden />
          </span>
          <span className="text-[11px] font-semibold text-navy-900">
            CampusOrbit AI
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Your cloud evidence is strong. A data certification would round out
          your profile next.
        </p>
      </div>
    </div>
  );
}
