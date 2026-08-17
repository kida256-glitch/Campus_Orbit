"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROLE_LABELS, type Role } from "@/lib/constants";
import { isActive, navFor } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navFor(role);
  const homeHref =
    role === "admin" ? "/admin" : role === "community_leader" ? "/leader" : "/dashboard";

  return (
    <aside className="hidden w-64 shrink-0 lg:flex lg:flex-col">
      {/* Sidebar background with subtle gradient */}
      <div className="flex h-full flex-col border-r border-border/80 bg-gradient-to-b from-white to-secondary/40">
        {/* Logo header */}
        <div className="flex h-16 items-center border-b border-border/60 px-5">
          <Logo href={homeHref} />
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4 scrollbar-slim"
          aria-label="Main navigation"
        >
          {/* Role label */}
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {ROLE_LABELS[role]}
          </p>

          <ul className="space-y-0.5">
            {items.map((item, i) => {
              const active = isActive(pathname, item.href);

              return (
                <li key={item.href} className={cn("animate-slide-in-left", `stagger-${Math.min(i + 1, 8)}`)}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-orbit-gradient text-white shadow-glow"
                        : "text-navy-600 hover:bg-orbit-50 hover:text-orbit-700",
                    )}
                  >
                    {/* Active left stripe */}
                    {active && (
                      <span className="absolute -left-3 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-full bg-white/50" />
                    )}

                    <item.icon
                      className={cn(
                        "size-[18px] shrink-0 transition-all duration-200",
                        active
                          ? "text-white"
                          : "text-navy-400 group-hover:text-orbit-600 group-hover:scale-110",
                      )}
                      aria-hidden
                    />
                    <span>{item.label}</span>

                    {/* Hover sparkle effect */}
                    {!active && (
                      <span className="absolute inset-0 rounded-xl bg-orbit-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-[0.04]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border/60 p-3">
          <div className="overflow-hidden rounded-2xl bg-orbit-gradient p-px shadow-glow">
            <div className="rounded-[calc(1rem-1px)] bg-white/95 px-3 py-2.5 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                Signed in as
              </p>
              <p className="mt-0.5 text-sm font-semibold text-navy-900">
                {ROLE_LABELS[role]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
