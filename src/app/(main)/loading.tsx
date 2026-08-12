import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shell-level skeleton. Shown while a route segment streams in, so navigation
 * never lands on a blank panel.
 */
export default function MainLoading() {
  return (
    <div className="space-y-8" aria-busy role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>

      {/* Header */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-3 h-4 w-80" />
        <div className="mt-6 flex gap-2">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border/80 bg-card p-5"
          >
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="mt-4 h-7 w-14" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Card grid */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-border/80 bg-card"
            >
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="p-4">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="mt-2 h-3 w-1/2" />
                <Skeleton className="mt-4 h-3 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
