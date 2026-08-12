"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterSelect {
  /** Query-string key this control writes to. */
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  placeholder?: string;
  selects?: FilterSelect[];
  className?: string;
}

/**
 * URL-driven search and filters.
 *
 * State lives in the query string so every filtered view is shareable,
 * bookmarkable and server-rendered. The search box debounces to avoid a
 * navigation per keystroke.
 */
export function FilterBar({
  placeholder = "Search…",
  selects = [],
  className,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [term, setTerm] = useState(searchParams.get("q") ?? "");

  // Keep the input in sync when the user navigates back/forward.
  useEffect(() => {
    setTerm(searchParams.get("q") ?? "");
  }, [searchParams]);

  function push(next: URLSearchParams) {
    const query = next.toString();
    startTransition(() => {
      router.replace(query ? `?${query}` : "?", { scroll: false });
    });
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (term === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (term) next.set("q", term);
      else next.delete("q");
      push(next);
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all") next.set(name, value);
    else next.delete(name);
    push(next);
  }

  const activeCount = [...searchParams.keys()].filter((key) =>
    ["q", ...selects.map((select) => select.name)].includes(key),
  ).length;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-soft sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy-400"
          aria-hidden
        />
        <Input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="pl-9"
        />
        {pending ? (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-navy-400"
            aria-hidden
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selects.map((select) => (
          <label key={select.name} className="flex items-center gap-1.5">
            <span className="sr-only">{select.label}</span>
            <select
              value={searchParams.get(select.name) ?? "all"}
              onChange={(event) => setParam(select.name, event.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-navy-800 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}

        {activeCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => push(new URLSearchParams())}
          >
            <X aria-hidden />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
