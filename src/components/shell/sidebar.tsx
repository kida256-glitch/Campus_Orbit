"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROLE_LABELS, type Role } from "@/lib/constants";
import { isActive, navFor } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

/**
 * Desktop sidebar. The item list is derived from the role stored on the
 * database profile and passed down from the server layout.
 */
export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navFor(role);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo href={`/${role === "admin" ? "admin" : role === "community_leader" ? "leader" : "dashboard"}`} />
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-slim"
        aria-label="Main navigation"
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-orbit-50 text-orbit-700"
                  : "text-navy-600 hover:bg-secondary hover:text-navy-900",
              )}
            >
              <item.icon
                className={cn(
                  "size-[18px] shrink-0 transition-colors",
                  active
                    ? "text-orbit-600"
                    : "text-navy-400 group-hover:text-navy-600",
                )}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-xl bg-secondary/70 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Signed in as
          </p>
          <p className="mt-0.5 text-sm font-semibold text-navy-900">
            {ROLE_LABELS[role]}
          </p>
        </div>
      </div>
    </aside>
  );
}
