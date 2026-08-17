import { BadgeCheck, Bot, CalendarDays, Sparkles, Trophy } from "lucide-react";

import { OrbitMark } from "@/components/brand/logo";

export function PortfolioPreview() {
  const skills = [
    { name: "Cloud Computing", value: 82, verified: 4 },
    { name: "Web3 & Blockchain", value: 68, verified: 3 },
    { name: "AI / Machine Learning", value: 61, verified: 2 },
  ];

  return (
    <div className="relative">
      {/* Main card */}
      <div className="overflow-hidden rounded-3xl border border-orbit-100/80 bg-white shadow-lift">
        {/* Browser chrome bar */}
        <div className="flex items-center gap-2.5 border-b border-border/70 bg-gradient-to-r from-secondary/80 to-orbit-50/50 px-4 py-3">
          {/* Traffic-light dots */}
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-3 rounded-full bg-red-400/70" />
            <span className="size-3 rounded-full bg-amber-400/70" />
            <span className="size-3 rounded-full bg-emeraldx-400/70" />
          </div>
          <OrbitMark className="size-6 rounded-lg" />
          <span className="text-xs font-medium text-navy-600">
            campusorbit.app / portfolio
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emeraldx-50 px-2.5 py-0.5 text-[10px] font-bold text-emeraldx-700 ring-1 ring-emeraldx-200">
            <BadgeCheck className="size-3" aria-hidden />
            Public
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Hero strip */}
          <div className="relative overflow-hidden rounded-2xl bg-orbit-gradient p-4">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{ background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 60%)" }}
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white backdrop-blur-sm ring-2 ring-white/30">
                AM
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">Alex Mutua</p>
                <p className="truncate text-xs text-white/75">University of Nairobi</p>
              </div>
              <Trophy className="ml-auto size-5 text-white/80 animate-float" aria-hidden />
            </div>
          </div>

          {/* Achievement counters */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Verified events", value: "12", color: "text-orbit-700 bg-orbit-50 border-orbit-100" },
              { label: "Certifications", value: "4", color: "text-emeraldx-700 bg-emeraldx-50 border-emeraldx-100" },
              { label: "Hackathons", value: "3", color: "text-amber-700 bg-amber-50 border-amber-100" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border p-2.5 ${stat.color}`}
              >
                <p className="text-xl font-bold leading-none number-animate">
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] leading-tight opacity-80">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="space-y-2.5 rounded-2xl border border-orbit-100/80 bg-orbit-50/30 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orbit-600">
              <Sparkles className="size-3" aria-hidden />
              Skills from verified activity
            </p>
            {skills.map((skill) => (
              <div key={skill.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-navy-800">{skill.name}</span>
                  <span className="font-medium text-orbit-600">{skill.verified} verified</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/80 shadow-inner">
                  <div
                    className="h-full rounded-full bg-orbit-gradient transition-all"
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Evidence trail */}
          <div className="space-y-1.5">
            {[
              { icon: CalendarDays, text: "Web3 Builders Hackathon", type: "Event" },
              { icon: Sparkles, text: "AWS Cloud Practitioner", type: "Certification" },
            ].map((row) => (
              <div
                key={row.text}
                className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-white px-3 py-2 shadow-sm"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-orbit-50">
                  <row.icon className="size-3.5 text-orbit-500" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-navy-800">{row.text}</p>
                  <p className="text-[10px] text-muted-foreground">{row.type}</p>
                </div>
                <BadgeCheck className="size-4 shrink-0 text-emeraldx-500" aria-label="Verified" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating AI badge */}
      <div className="absolute -bottom-5 -left-3 hidden w-56 overflow-hidden rounded-2xl border border-border/80 bg-white p-3 shadow-lift animate-float sm:block lg:-left-10">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-orbit-gradient shadow-glow">
            <Bot className="size-4 text-white" aria-hidden />
          </span>
          <span className="text-[11px] font-bold text-navy-900">CampusOrbit AI</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Your cloud evidence is strong. A data certification would round out your profile next.
        </p>
      </div>

      {/* Floating verified pill */}
      <div className="absolute -right-3 top-4 hidden rounded-full border border-emeraldx-200 bg-emeraldx-50 px-2.5 py-1 shadow-sm animate-float-slow sm:flex items-center gap-1.5 text-[10px] font-bold text-emeraldx-700">
        <BadgeCheck className="size-3" aria-hidden />
        Auto-built
      </div>
    </div>
  );
}
