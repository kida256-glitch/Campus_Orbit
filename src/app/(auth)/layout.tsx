import Link from "next/link";
import { ArrowLeft, BadgeCheck, Bot, Compass } from "lucide-react";

import { APP_TAGLINE } from "@/lib/constants";
import { Logo, OrbitMark } from "@/components/brand/logo";
import { AnimatedShaderBackground } from "@/components/ui/animated-shader-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* Form column */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-navy-900"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Home
          </Link>
        </div>

        <main
          id="main"
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10"
        >
          {children}
        </main>
      </div>

      {/* Brand column — decorative, hidden on small screens */}
      <aside className="relative hidden overflow-hidden bg-navy-950 lg:flex lg:flex-col lg:justify-center">
        {/* Aurora shader background */}
        <AnimatedShaderBackground opacity={0.75} />

        {/* Dark overlay so text stays readable */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(135deg, rgba(10,16,32,0.45) 0%, rgba(10,16,32,0.25) 50%, rgba(10,16,32,0.55) 100%)",
          }}
          aria-hidden
        />

        {/* Animated glow orbs still layer on top */}
        <div
          aria-hidden
          className="glow-orb absolute -right-24 -top-24 z-20 size-[26rem] bg-orbit-600/15 animate-float-slow"
        />
        <div
          aria-hidden
          className="glow-orb absolute -bottom-32 -left-20 z-20 size-[24rem] bg-emeraldx-500/10 animate-float"
        />

        <div className="relative z-30 px-12 xl:px-16">
          <OrbitMark spin className="size-12 rounded-2xl animate-pulse-glow" />

          <h2 className="mt-8 max-w-md text-3xl font-semibold leading-tight tracking-[-0.02em] text-white xl:text-4xl">
            {APP_TAGLINE}
          </h2>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-navy-200">
            Everything happening in campus tech, in one place — and a portfolio
            that builds itself from what you actually take part in.
          </p>

          <ul className="mt-10 space-y-5">
            {[
              {
                icon: Compass,
                title: "Discover what fits you",
                body: "Events and opportunities ranked against your interests and demonstrated skills.",
              },
              {
                icon: BadgeCheck,
                title: "Verified, not self-reported",
                body: "Organisers confirm attendance, so your evidence carries weight.",
              },
              {
                icon: Bot,
                title: "CampusOrbit AI",
                body: "Personal guidance grounded in your real activity record.",
              },
            ].map((item, i) => (
              <li
                key={item.title}
                className="flex gap-4 animate-slide-in-right"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/20">
                  <item.icon className="size-4 text-orbit-200" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-navy-300">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-xs text-navy-400">
            For every school, university and college.
          </p>
        </div>
      </aside>
    </div>
  );
}
