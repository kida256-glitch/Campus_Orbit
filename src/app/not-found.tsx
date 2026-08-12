import Link from "next/link";
import { Compass, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background bg-orbit-mesh px-6 text-center">
      <Logo />

      <p className="mt-10 text-sm font-semibold uppercase tracking-[0.12em] text-orbit-600">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-3xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The link may be out of date, or the item may have been removed. If you
        were looking for a student portfolio, it might be set to private.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">
            <Home aria-hidden />
            Home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/discover">
            <Compass aria-hidden />
            Explore CampusOrbit
          </Link>
        </Button>
      </div>
    </div>
  );
}
