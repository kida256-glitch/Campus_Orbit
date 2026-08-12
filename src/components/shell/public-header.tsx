import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

const LINKS = [
  { label: "Discover", href: "/discover" },
  { label: "Events", href: "/events" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Marketplace", href: "/marketplace" },
];

/**
 * Header for signed-out visitors browsing the public catalogs. Anonymous
 * browsing is intentional: RLS exposes approved events, published
 * opportunities and approved listings to `anon`.
 */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Browse">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-secondary hover:text-navy-900"
            >
              {link.label}
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

      {/* Mobile link row, since there is no bottom bar for anonymous users. */}
      <nav
        className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 scrollbar-slim md:hidden"
        aria-label="Browse"
      >
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-secondary"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
