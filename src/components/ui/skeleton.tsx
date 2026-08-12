import { cn } from "@/lib/utils";

/** Base skeleton block. Use to mirror the shape of the content being loaded. */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("shimmer rounded-lg bg-navy-100/70", className)}
      {...props}
    />
  );
}

/** Card-shaped skeleton used by event, opportunity and listing grids. */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

/** Grid of card skeletons. */
function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Stat-tile skeleton row used at the top of dashboards. */
function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-border/80 bg-card p-5 shadow-soft"
        >
          <Skeleton className="size-9 rounded-xl" />
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonGrid, SkeletonStats };
