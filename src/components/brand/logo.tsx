import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * CampusOrbit mark: a node on an orbital path around a campus core, with two
 * smaller connected nodes suggesting a network of students and communities.
 */
export function OrbitMark({
  className,
  spin = false,
}: {
  className?: string;
  spin?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-orbit-gradient shadow-glow",
        className,
      )}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className={cn("size-[22px]", spin && "animate-spin-slow")}
      >
        {/* Orbital path */}
        <ellipse
          cx="16"
          cy="16"
          rx="13"
          ry="7.5"
          transform="rotate(-28 16 16)"
          stroke="white"
          strokeOpacity="0.75"
          strokeWidth="1.6"
        />
        {/* Campus core */}
        <circle cx="16" cy="16" r="4.4" fill="white" />
        {/* Connected nodes on the orbit */}
        <circle cx="26.2" cy="9.4" r="2.5" fill="white" />
        <circle cx="5.8" cy="22.6" r="1.9" fill="white" fillOpacity="0.85" />
      </svg>
    </span>
  );
}

interface LogoProps {
  className?: string;
  /** Hide the wordmark, e.g. in a collapsed sidebar. */
  markOnly?: boolean;
  href?: string;
  spin?: boolean;
}

export function Logo({
  className,
  markOnly = false,
  href = "/",
  spin = false,
}: LogoProps) {
  const content = (
    <>
      <OrbitMark spin={spin} />
      {markOnly ? null : (
        <span className="text-[17px] font-semibold tracking-[-0.02em] text-navy-900">
          Campus<span className="text-orbit-600">Orbit</span>
        </span>
      )}
    </>
  );

  if (!href) {
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-90",
        className,
      )}
      aria-label="CampusOrbit home"
    >
      {content}
    </Link>
  );
}
